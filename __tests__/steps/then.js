require('dotenv').config()
const AWS = require('aws-sdk')
const http = require('axios')
const fs = require('fs')

const user_exists_in_UsersTable = async (id) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()

  console.log(`looking for user [${id}] in table [${process.env.USERS_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.USERS_TABLE,
    Key: {
      id
    }
  }).promise()

  expect(resp.Item).toBeTruthy()

  return resp.Item
}

const tweetsCount_is_updated_in_UsersTable = async (id, newCount) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()

  console.log(`looking for user [${id}] in table [${process.env.USERS_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.USERS_TABLE,
    Key: {
      id
    }
  }).promise()

  expect(resp.Item).toBeTruthy()
  expect(resp.Item.tweetsCount).toEqual(newCount)

  return resp.Item
}

const tweet_exists_in_TweetsTable = async (id) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()

  console.log(`looking for tweet [${id}] in table [${process.env.TWEETS_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.TWEETS_TABLE,
    Key: {
      id
    }
  }).promise()

  expect(resp.Item).toBeTruthy()

  return resp.Item
}

const tweet_exists_in_TimelinesTable = async (userId, tweetId) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()

  console.log(`looking for tweet [${tweetId}] for user [${userId}] in table [${process.env.TIMELINES_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.TIMELINES_TABLE,
    Key: {
      userId,
      tweetId
    }
  }).promise()

  expect(resp.Item).toBeTruthy()

  return resp.Item
}

const user_can_upload_image_to_url = async (url, filepath, contentType) => {
  const data = fs.readFileSync(filepath)
  await http({
    method: 'put',
    url,
    headers: {
      'Content-Type': contentType
    },
    data
  })

  console.log('uploaded image to', url)
}

const user_can_download_image_from = async (url) => {
  const resp = await http(url)

  console.log('downloaded image from', url)

  return resp.data
}

module.exports = {
  user_exists_in_UsersTable,
  tweetsCount_is_updated_in_UsersTable,
  tweet_exists_in_TweetsTable,
  tweet_exists_in_TimelinesTable,
  user_can_upload_image_to_url,
  user_can_download_image_from
}