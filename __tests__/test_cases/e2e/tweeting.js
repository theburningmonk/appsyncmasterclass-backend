require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()

describe('Given an authenticated user', () => {
  let userA
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
  })

  describe('When he sends a tweet', () => {
    let tweet
    const text = chance.string({ length: 16 })
    beforeAll(async () => {
      tweet = await when.a_user_calls_tweet(userA, text)
    })

    it('Should return the new tweet', () => {
      expect(tweet).toMatchObject({
        text,
        replies: 0,
        likes: 0,
        retweets: 0,
        liked: false,
      })
    })

    describe('When he calls getTweets', () => {
      let tweets, nextToken
      beforeAll(async () => {
        const result = await when.a_user_calls_getTweets(userA, userA.username, 25)
        tweets = result.tweets
        nextToken = result.nextToken
      })

      it('He will see the new tweet in the tweets array', () => {
        expect(nextToken).toBeNull()
        expect(tweets.length).toEqual(1)
        expect(tweets[0]).toEqual(tweet)
      })
  
      it('He cannot ask for more than 25 tweets in a page', async () => {
        await expect(when.a_user_calls_getTweets(userA, userA.username, 26))
          .rejects
          .toMatchObject({
            message: expect.stringContaining('max limit is 25')
          })
      })
    })

    describe('When he calls getMyTimeline', () => {
      let tweets, nextToken
      beforeAll(async () => {
        const result = await when.a_user_calls_getMyTimeline(userA, 25)
        tweets = result.tweets
        nextToken = result.nextToken
      })

      it('He will see the new tweet in the tweets array', () => {
        expect(nextToken).toBeNull()
        expect(tweets.length).toEqual(1)
        expect(tweets[0]).toEqual(tweet)
      })
  
      it('He cannot ask for more than 25 tweets in a page', async () => {
        await expect(when.a_user_calls_getMyTimeline(userA, 26))
          .rejects
          .toMatchObject({
            message: expect.stringContaining('max limit is 25')
          })
      })
    })

    describe('When he likes the tweet', () => {
      beforeAll(async () => {
        await when.a_user_calls_like(userA, tweet.id)
      })

      it('Should see Tweet.liked as true', async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)

        expect(tweets).toHaveLength(1)
        expect(tweets[0].id).toEqual(tweet.id)
        expect(tweets[0].liked).toEqual(true)
      })

      it('Should not be able to like the same tweet a second time', async () => {
        await expect(() => when.a_user_calls_like(userA, tweet.id))
          .rejects
          .toMatchObject({
            message: expect.stringContaining('DynamoDB transaction error')
          })
      })

      it('Should see this tweet when he calls getLikes', async () => {
        const { tweets, nextToken } = await when.a_user_calls_getLikes(userA, userA.username, 25)

        expect(nextToken).toBeNull()
        expect(tweets).toHaveLength(1)
        expect(tweets[0]).toMatchObject({
          ...tweet,
          liked: true,
          likes: 1,
          profile: {
            ...tweet.profile,
            likesCounts: 1
          }
        })
      })

      describe('When he unlikes the tweet', () => {
        beforeAll(async () => {
          await when.a_user_calls_unlike(userA, tweet.id)
        })

        it('Should see Tweet.liked as false', async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)
  
          expect(tweets).toHaveLength(1)
          expect(tweets[0].id).toEqual(tweet.id)
          expect(tweets[0].liked).toEqual(false)
        })
  
        it('Should not be able to unlike the same tweet a second time', async () => {
          await expect(() => when.a_user_calls_unlike(userA, tweet.id))
            .rejects
            .toMatchObject({
              message: expect.stringContaining('DynamoDB transaction error')
            })
        })

        it('Should not see this tweet when he calls getLikes anymore', async () => {
          const { tweets, nextToken } = await when.a_user_calls_getLikes(userA, userA.username, 25)

          expect(nextToken).toBeNull()
          expect(tweets).toHaveLength(0)
        })
      })
    })

    describe('When he retweets the tweet', () => {
      beforeAll(async () => {
        await when.a_user_calls_retweet(userA, tweet.id)
      })

      it('Should see the retweet when he calls getTweets', async () => {
        const { tweets } = await when.a_user_calls_getTweets(userA, userA.username, 25)

        expect(tweets).toHaveLength(2)
        expect(tweets[0]).toMatchObject({
          profile: {
            id: userA.username,
            tweetsCount: 2
          },
          retweetOf: {
            ...tweet,
            retweets: 1,
            retweeted: true,
            profile: {
              id: userA.username,
              tweetsCount: 2
            }
          }
        })
        expect(tweets[1]).toMatchObject({
          ...tweet,
          retweets: 1,
          retweeted: true,
          profile: {
            id: userA.username,
            tweetsCount: 2
          }
        })
      })

      it('Should not see the retweet when he calls getMyTimeline', async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)

        expect(tweets).toHaveLength(1)
        expect(tweets[0]).toMatchObject({
          ...tweet,
          retweets: 1,
          retweeted: true,
          profile: {
            id: userA.username,
            tweetsCount: 2
          }
        })
      })

      describe('When he unretweets the tweet', () => {
        beforeAll(async () => {
          await when.a_user_calls_unretweet(userA, tweet.id)
        })

        it('Should not see the retweet when he calls getTweets anymore', async () => {
          const { tweets } = await when.a_user_calls_getTweets(userA, userA.username, 25)

          expect(tweets).toHaveLength(1)
          expect(tweets[0]).toMatchObject({
            ...tweet,
            retweets: 0,
            retweeted: false,
            profile: {
              id: userA.username,
              tweetsCount: 1
            }
          })
        })
      })
    })

    describe('Given another user, user B, sends a tweet', () => {
      let userB, anotherTweet
      const text = chance.string({ length: 16 })
      beforeAll(async () => {
        userB = await given.an_authenticated_user()
        anotherTweet = await when.a_user_calls_tweet(userB, text)
      })

      describe("When user A retweets user B's tweet", () => {
        beforeAll(async () => {
          await when.a_user_calls_retweet(userA, anotherTweet.id)
        })

        it('Should see the retweet when he calls getTweets', async () => {
          const { tweets } = await when.a_user_calls_getTweets(userA, userA.username, 25)
  
          expect(tweets).toHaveLength(2)
          expect(tweets[0]).toMatchObject({
            profile: {
              id: userA.username,
              tweetsCount: 2
            },
            retweetOf: {
              ...anotherTweet,
              retweets: 1,
              retweeted: true
            }
          })
        })
  
        it('Should see the retweet when he calls getMyTimeline', async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)
  
          expect(tweets).toHaveLength(2)
          expect(tweets[0]).toMatchObject({
            profile: {
              id: userA.username,
              tweetsCount: 2
            },
            retweetOf: {
              ...anotherTweet,
              retweets: 1,
              retweeted: true
            }
          })
        })

        describe("When user A unretweets user B's tweet", () => {
          beforeAll(async () => {
            await when.a_user_calls_unretweet(userA, anotherTweet.id)
          })

          it('User A should not see the retweet when he calls getTweets anymore', async () => {
            const { tweets } = await when.a_user_calls_getTweets(userA, userA.username, 25)

            expect(tweets).toHaveLength(1)
            expect(tweets[0]).toMatchObject({
              ...tweet,
              retweets: 0,
              retweeted: false,
              profile: {
                id: userA.username,
                tweetsCount: 1
              }
            })
          })

          it('User A should not see the retweet when he calls getMyTimeline anymore', async () => {
            const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)
  
            expect(tweets).toHaveLength(1)
            expect(tweets[0]).toMatchObject({
              ...tweet,
              profile: {
                id: userA.username,
                tweetsCount: 1
              }
            })
          })
        })
      })
    })
  })
})