const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe('Given two authenticated users, use A and user B', () => {
  let userA, userB
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userB = await given.an_authenticated_user()
  })

  describe('When user A sends a tweet', () => {
    let tweet
    const text = chance.string({ length: 16 })
    beforeAll(async () => {
      tweet = await when.we_invoke_tweet(userA.username, text)
    })
  
    describe("When user B replies to user A's tweet", () => {
      const replyText = chance.string({ length: 16 })
      beforeAll(async () => {
        await when.we_invoke_reply(userB.username, tweet.id, replyText)
      })
  
      it('Saves the reply in the Tweets table', async () => {
        const reply = await then.reply_exists_in_TweetsTable(userB.username, tweet.id)
        
        expect(reply).toMatchObject({
          text: replyText,
          replies: 0,
          likes: 0,
          retweets: 0,
          inReplyToTweetId: tweet.id,
          inReplyToUserIds: [userA.username]
        })
      })
  
      it('Increments the replies count in the Tweets table', async () => {
        const { replies } = await then.tweet_exists_in_TweetsTable(tweet.id)
  
        expect(replies).toEqual(1)
      })
  
      it('Increments the tweetsCount in the Users table', async () => {
        await then.tweetsCount_is_updated_in_UsersTable(userB.username, 1)
      })
  
      it("Saves the reply in the Timelines tables", async () => {
        const tweets = await then.there_are_N_tweets_in_TimelinesTable(userB.username, 1)
  
        expect(tweets[0].inReplyToTweetId).toEqual(tweet.id)
      })

      describe("When user A replies to user B's reply", () => {
        let userBsReply
        const replyText = chance.string({ length: 16 })
        beforeAll(async () => {
          userBsReply = await then.reply_exists_in_TweetsTable(userB.username, tweet.id)
          await when.we_invoke_reply(userA.username, userBsReply.id, replyText)
        })

        it('Saves the reply in the Tweets table', async () => {
          const reply = await then.reply_exists_in_TweetsTable(userA.username, userBsReply.id)
          
          expect(reply).toMatchObject({
            text: replyText,
            replies: 0,
            likes: 0,
            retweets: 0,
            inReplyToTweetId: userBsReply.id,
            inReplyToUserIds: expect.arrayContaining([userA.username, userB.username])
          })
          expect(reply.inReplyToUserIds).toHaveLength(2)
        })
      })
    })

    describe("When user B retweets user A's tweet", () => {
      let userBsRetweet
      beforeAll(async () => {
        await when.we_invoke_retweet(userB.username, tweet.id)
        userBsRetweet = await then.retweet_exists_in_TweetsTable(userB.username, tweet.id)
      })

      describe("When user A replies to user B's retweet", () => {
        const replyText = chance.string({ length: 16 })
        beforeAll(async () => {
          await when.we_invoke_reply(userA.username, userBsRetweet.id, replyText)
        })

        it('Saves the reply in the Tweets table', async () => {
          const reply = await then.reply_exists_in_TweetsTable(userA.username, userBsRetweet.id)

          expect(reply).toMatchObject({
            text: replyText,
            replies: 0,
            likes: 0,
            retweets: 0,
            inReplyToTweetId: userBsRetweet.id,
            inReplyToUserIds: expect.arrayContaining([userA.username, userB.username])
          })
          expect(reply.inReplyToUserIds).toHaveLength(2)
        })      
      })
    })
  })
})