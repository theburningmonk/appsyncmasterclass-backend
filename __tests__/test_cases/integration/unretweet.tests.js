const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe("Given an authenticated user retweeted another user's tweet", () => {
  let userA, userB, tweet
  const text = chance.string({ length: 16 })
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userB = await given.an_authenticated_user()
    tweet = await when.we_invoke_tweet(userB.username, text)
    await when.we_invoke_retweet(userA.username, tweet.id)
  })

  describe("When user A unretweets user B's tweet", () => {
    beforeAll(async () => {
      await when.we_invoke_unretweet(userA.username, tweet.id)
    })

    it('Removes the retweet from the Tweets table', async () => {
      await then.retweet_does_not_exist_in_TweetsTable(userA.username, tweet.id)
    })

    it('Removes the retweet from the Retweets table', async () => {
      await then.retweet_does_not_exist_in_RetweetsTable(userA.username, tweet.id)
    })

    it('Decrements the retweets count in the Tweets table', async () => {
      const { retweets } = await then.tweet_exists_in_TweetsTable(tweet.id)

      expect(retweets).toEqual(0)
    })

    it('Decrements the tweetsCount in the Users table', async () => {
      await then.tweetsCount_is_updated_in_UsersTable(userA.username, 0)
    })

    it("Removes the retweet from the Timelines tables", async () => {
      await then.there_are_N_tweets_in_TimelinesTable(userA.username, 0)
    })
  })
})