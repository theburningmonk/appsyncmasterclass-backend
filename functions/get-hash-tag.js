const chance = require('chance').Chance()
const { initUsersIndex, initTweetsIndex } = require('../lib/algolia')
const { SearchModes } = require('../lib/constants')
const middy = require('@middy/core')
const ssm = require('@middy/ssm')

const { STAGE } = process.env

module.exports.handler = middy(async (event, context) => {
  const userId = event.identity.username
  const { hashTag, mode, limit, nextToken } = event.arguments

  switch (mode) {
    case SearchModes.PEOPLE:
      return await searchPeople(context, userId, hashTag, limit, nextToken)
    case SearchModes.LATEST:
      return await searchLatest(context, hashTag, limit, nextToken)
    default:
      throw new Error('Only "People" and "Latest" hash tag modes are supported right now')
  }
}).use(ssm({
  cache: true,
  cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
  names: {
    ALGOLIA_APP_ID: `/${STAGE}/algolia-app-id`,
    ALGOLIA_WRITE_KEY: `/${STAGE}/algolia-admin-key`
  },
  setToContext: true,
  throwOnFailedCall: true
}))

async function searchPeople(context, userId, hashTag, limit, nextToken) {
  const index = await initUsersIndex(
    context.ALGOLIA_APP_ID, context.ALGOLIA_WRITE_KEY, STAGE)

  const searchParams = parseNextToken(nextToken) || {
    hitsPerPage: limit,
    page: 0
  }

  const query = hashTag.replace('#', '')
  const { hits, page, nbPages } = await index.search(query, searchParams)
  hits.forEach(x => {
    x.__typename = x.id === userId ? 'MyProfile' : 'OtherProfile'
  })

  let nextSearchParams
  if (page + 1 >= nbPages) {
    nextSearchParams = null
  } else {
    nextSearchParams = Object.assign({}, searchParams, { page: page + 1 })
  }

  return {
    results: hits,
    nextToken: genNextToken(nextSearchParams)
  }
}

async function searchLatest(context, hashTag, limit, nextToken) {
  const index = await initTweetsIndex(
    context.ALGOLIA_APP_ID, context.ALGOLIA_WRITE_KEY, STAGE)

  const searchParams = parseNextToken(nextToken) || {
    facetFilters: [`hashTags:${hashTag}`],
    hitsPerPage: limit,
    page: 0
  }

  const { hits, page, nbPages } = await index.search("", searchParams)

  let nextSearchParams
  if (page + 1 >= nbPages) {
    nextSearchParams = null
  } else {
    nextSearchParams = Object.assign({}, searchParams, { page: page + 1 })
  }

  return {
    results: hits,
    nextToken: genNextToken(nextSearchParams)
  }
}

function parseNextToken(nextToken) {
  if (!nextToken) {
    return undefined
  }

  const token = Buffer.from(nextToken, 'base64').toString()
  const searchParams = JSON.parse(token)
  delete searchParams.random

  return searchParams
}

function genNextToken(searchParams) {
  if (!searchParams) {
    return null
  }

  const payload = Object.assign(
    {}, searchParams, { random: chance.string({ length: 16 }) })
  const token = JSON.stringify(payload)
  return Buffer.from(token).toString('base64')
}
