require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()

describe('Given authenticated users, user A, B and C', () => {
  let userA, userB, userC, userAsTweet
  const text = chance.string({ length: 16 })
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userB = await given.an_authenticated_user()
    userC = await given.an_authenticated_user()
    userAsTweet = await when.a_user_calls_tweet(userA, text)
  })

  describe("When user B replies to user A's tweet", () => {
    let usersBsReply
    const replyText = chance.string({ length: 16 })
    beforeAll(async () => {
      usersBsReply = await when.a_user_calls_reply(userB, userAsTweet.id, replyText)
    })

    it('User B should see his reply when he calls getTweets', async () => {
      const { tweets } = await when.a_user_calls_getTweets(userB, userB.username, 25)

      expect(tweets).toHaveLength(1)
      expect(tweets[0]).toMatchObject({
        profile: {
          id: userB.username,
          tweetsCount: 1
        },
        inReplyToTweet: {
          id: userAsTweet.id,
          replies: 1
        },
        inReplyToUsers: [{
          id: userA.username
        }]
      })
    })

    it('User B should see his reply when he calls getMyTimeline', async () => {
      const { tweets } = await when.a_user_calls_getMyTimeline(userB, 25)

      expect(tweets).toHaveLength(1)
      expect(tweets[0]).toMatchObject({
        profile: {
          id: userB.username,
          tweetsCount: 1
        },
        inReplyToTweet: {
          id: userAsTweet.id,
          replies: 1
        },
        inReplyToUsers: [{
          id: userA.username
        }]
      })
    })

    describe("When user C replies to user B's reply", () => {
      let usersCsReply
      const replyText = chance.string({ length: 16 })
      beforeAll(async () => {
        usersCsReply = await when.a_user_calls_reply(userC, usersBsReply.id, replyText)
      })

      it('User C should see his reply when he calls getTweets', async () => {
        const { tweets } = await when.a_user_calls_getTweets(userC, userC.username, 25)

        expect(tweets).toHaveLength(1)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: userC.username,
            tweetsCount: 1
          },
          inReplyToTweet: {
            id: usersBsReply.id,
            replies: 1
          },
          inReplyToUsers: expect.arrayContaining([
            expect.objectContaining({
              id: userB.username
            }),
            expect.objectContaining({
              id: userA.username
            })
          ])
        })
        expect(tweets[0].inReplyToUsers).toHaveLength(2)
      })

      it('User C should see his reply when he calls getMyTimeline', async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userC, 25)

        expect(tweets).toHaveLength(1)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: userC.username,
            tweetsCount: 1
          },
          inReplyToTweet: {
            id: usersBsReply.id,
            replies: 1
          },
          inReplyToUsers: expect.arrayContaining([
            expect.objectContaining({
              id: userB.username
            }),
            expect.objectContaining({
              id: userA.username
            })
          ])
        })
        expect(tweets[0].inReplyToUsers).toHaveLength(2)
      })
    })
  })

  describe("When user C retweets user A's tweet", () => {
    let userCsRetweet
    beforeAll(async () => {
      userCsRetweet = await when.a_user_calls_retweet(userC, userAsTweet.id)
    })

    describe("When user B replies to user C's retweet", () => {
      let usersBsReply
      const replyText = chance.string({ length: 16 })
      beforeAll(async () => {
        usersBsReply = await when.a_user_calls_reply(userB, userCsRetweet.id, replyText)
      })

      it('User B should see his reply when he calls getTweets', async () => {
        const { tweets } = await when.a_user_calls_getTweets(userB, userB.username, 25)

        expect(tweets).toHaveLength(2)
        expect(tweets[0]).toMatchObject({
          inReplyToTweet: {
            id: userCsRetweet.id
          },
          inReplyToUsers: expect.arrayContaining([
            expect.objectContaining({
              id: userC.username
            }),
            expect.objectContaining({
              id: userA.username
            })
          ])
        })
        expect(tweets[0].inReplyToUsers).toHaveLength(2)
      })

      it('User B should see his reply when he calls getMyTimeline', async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userB, 25)

        expect(tweets).toHaveLength(2)
        expect(tweets[0]).toMatchObject({
          inReplyToTweet: {
            id: userCsRetweet.id
          },
          inReplyToUsers: expect.arrayContaining([
            expect.objectContaining({
              id: userC.username
            }),
            expect.objectContaining({
              id: userA.username
            })
          ])
        })
        expect(tweets[0].inReplyToUsers).toHaveLength(2)
      })
    })
  })
})