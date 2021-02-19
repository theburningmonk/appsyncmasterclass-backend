const given = require('../../steps/given')
const when = require('../../steps/when')
const { SearchModes, TweetTypes } = require('../../../lib/constants')
const retry = require('async-retry')
const chance = require('chance').Chance()

describe('Given an authenticated user', () => {
  let userA, userAsProfile
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userAsProfile = await when.a_user_calls_getMyProfile(userA)
  })

  it('The user can find himself when he searches for his twitter handle', async () => {
    await retry(async () => {
      const { results, nextToken } = await when.a_user_calls_search(
        userA, SearchModes.PEOPLE, userAsProfile.screenName, 10)

      expect(nextToken).toBeNull()
      expect(results).toHaveLength(1)
      expect(results[0]).toMatchObject({
        __typename: 'MyProfile',
        id: userAsProfile.id,
        name: userAsProfile.name,
        screenName: userAsProfile.screenName
      })
    }, {
      retries: 5,
      maxTimeout: 1000
    })
  }, 10000)

  it('The user can find himself when he searches for his name', async () => {
    await retry(async () => {
      const { results } = await when.a_user_calls_search(
        userA, SearchModes.PEOPLE, userAsProfile.name, 10)

      expect(results).toEqual(expect.arrayContaining([
        expect.objectContaining({
          __typename: 'MyProfile',
          id: userAsProfile.id,
          name: userAsProfile.name,
          screenName: userAsProfile.screenName
        })
      ]))
    }, {
      retries: 5,
      maxTimeout: 1000
    })
  }, 10000)

  describe('When the user sends a tweet', () => {
    let tweet
    const text = chance.string({ length: 16 })
    beforeAll(async () => {
      tweet = await when.a_user_calls_tweet(userA, text)
    })

    it('The user can find his tweet when he searches for the text', async () => {
      await retry(async () => {
        const { results, nextToken } = await when.a_user_calls_search(
          userA, SearchModes.LATEST, text, 10)

        expect(nextToken).toBeNull()
        expect(results).toHaveLength(1)
        expect(results[0]).toMatchObject({
          __typename: TweetTypes.TWEET,
          id: tweet.id,
          text
        })
      }, {
        retries: 5,
        maxTimeout: 1000
      })
    }, 10000)

    describe('When the user replies to the tweet', () => {
      let reply
      const replyText = chance.string({ length: 16 })
      beforeAll(async () => {
        reply = await when.a_user_calls_reply(userA, tweet.id, replyText)
      })

      it('The user can find his reply when he searches for the reply text', async () => {
        await retry(async () => {
          const { results, nextToken } = await when.a_user_calls_search(
            userA, SearchModes.LATEST, replyText, 10)

          expect(nextToken).toBeNull()
          expect(results).toHaveLength(1)
          expect(results[0]).toMatchObject({
            __typename: TweetTypes.REPLY,
            id: reply.id,
            text: replyText
          })
        }, {
          retries: 5,
          maxTimeout: 1000
        })
      }, 10000)
    })
  })
})