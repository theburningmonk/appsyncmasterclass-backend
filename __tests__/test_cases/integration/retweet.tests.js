const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe('Given an authenticated user with a tweet', () => {
  let userA, tweet
  const text = chance.string({ length: 16 })
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    tweet = await when.we_invoke_tweet(userA.username, text)
  })

  describe('When he retweets his own tweet', () => {
    beforeAll(async () => {
      await when.we_invoke_retweet(userA.username, tweet.id)
    })

    it('Saves the retweet in the Tweets table', async () => {
      await then.retweet_exists_in_TweetsTable(userA.username, tweet.id)
    })

    it('Saves the retweet in the Retweets table', async () => {
      await then.retweet_exists_in_RetweetsTable(userA.username, tweet.id)
    })

    it('Increments the retweets count in the Tweets table', async () => {
      const { retweets } = await then.tweet_exists_in_TweetsTable(tweet.id)

      expect(retweets).toEqual(1)
    })

    it('Increments the tweetsCount in the Users table', async () => {
      await then.tweetsCount_is_updated_in_UsersTable(userA.username, 2)
    })

    it("Doesn't save the retweet in the Timelines tables", async () => {
      const tweets = await then.there_are_N_tweets_in_TimelinesTable(userA.username, 1)

      expect(tweets[0].tweetId).toEqual(tweet.id)
    })
  })

  describe("When he retweets another user's tweet", () => {
    let userB, anotherTweet
    const text = chance.string({ length: 16 })
    beforeAll(async () => {
      userB = await given.an_authenticated_user()
      anotherTweet = await when.we_invoke_tweet(userB.username, text)
      await when.we_invoke_retweet(userA.username, anotherTweet.id)
    })

    it('Saves the retweet in the Tweets table', async () => {
      await then.retweet_exists_in_TweetsTable(userA.username, anotherTweet.id)
    })

    it('Saves the retweet in the Retweets table', async () => {
      await then.retweet_exists_in_RetweetsTable(userA.username, anotherTweet.id)
    })

    it('Increments the retweets count in the Tweets table', async () => {
      const { retweets } = await then.tweet_exists_in_TweetsTable(anotherTweet.id)

      expect(retweets).toEqual(1)
    })

    it('Increments the tweetsCount in the Users table', async () => {
      await then.tweetsCount_is_updated_in_UsersTable(userA.username, 3)
    })

    it("Saves the retweet in the Timelines tables", async () => {
      const tweets = await then.there_are_N_tweets_in_TimelinesTable(userA.username, 2)

      expect(tweets[0].retweetOf).toEqual(anotherTweet.id)
      expect(tweets[1].tweetId).toEqual(tweet.id)
    })
  })
})