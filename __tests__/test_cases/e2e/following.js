require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()
const retry = require('async-retry')

describe('Given authenticated users, user A and B', () => {
  let userA, userB, userAsProfile, userBsProfile
  let userBsTweet1, userBsTweet2
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userB = await given.an_authenticated_user()
    userAsProfile = await when.a_user_calls_getMyProfile(userA)
    userBsProfile = await when.a_user_calls_getMyProfile(userB)
    userBsTweet1 = await when.a_user_calls_tweet(userB, chance.paragraph())
    userBsTweet2 = await when.a_user_calls_tweet(userB, chance.paragraph())
  })

  describe("When user A follows user B", () => {
    beforeAll(async () => {
      await when.a_user_calls_follow(userA, userB.username)
    })

    it("User A should see following as true when viewing user B's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)

      expect(following).toBe(true)
      expect(followedBy).toBe(false)
    })

    it("User B should see followedBy as true when viewing user A's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)

      expect(following).toBe(false)
      expect(followedBy).toBe(true)
    })

    it("User A should see himself in user B's list of followers", async () => {
      const { profiles } = await when.a_user_calls_getFollowers(userA, userB.username, 25)

      expect(profiles).toHaveLength(1)
      expect(profiles[0]).toMatchObject({
        id: userA.username
      })
      expect(profiles[0]).not.toHaveProperty('following')
      expect(profiles[0]).not.toHaveProperty('followedBy')
    })

    it("User A should see user B in his list of following", async () => {
      const { profiles } = await when.a_user_calls_getFollowing(userA, userA.username, 25)

      expect(profiles).toHaveLength(1)
      expect(profiles[0]).toMatchObject({
        id: userB.username,
        following: true,
        followedBy: false
      })
    })

    it("User B should see user A in his list of followers", async () => {
      const { profiles } = await when.a_user_calls_getFollowers(userB, userB.username, 25)

      expect(profiles).toHaveLength(1)
      expect(profiles[0]).toMatchObject({
        id: userA.username,
        following: false,
        followedBy: true
      })
    })

    it("User B should not see user A in his list of following", async () => {
      const { profiles } = await when.a_user_calls_getFollowing(userB, userB.username, 25)

      expect(profiles).toHaveLength(0)
    })

    it("Adds user B's tweets to user A's timeline", async () => {
      retry(async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)
  
        expect(tweets).toHaveLength(2)
        expect(tweets).toEqual([
          expect.objectContaining({
            id: userBsTweet2.id
          }),
          expect.objectContaining({
            id: userBsTweet1.id
          }),
        ])
      }, {
        retries: 3,
        maxTimeout: 1000
      })
    })

    describe("User B sends a tweet", () => {
      let tweet
      const text = chance.string({ length: 16 })
      beforeAll(async () => {
        tweet = await when.a_user_calls_tweet(userB, text)
      })

      it("Should appear in user A's timeline", async () => {
        await retry(async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)
  
          expect(tweets).toHaveLength(3)
          expect(tweets[0].id).toEqual(tweet.id)
        }, {
          retries: 3,
          maxTimeout: 1000
        })
      })
    })
  })

  describe("When user B follows user A back", () => {
    beforeAll(async () => {
      await when.a_user_calls_follow(userB, userA.username)
    })

    it("User A should see both following and followedBy as true when viewing user B's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)

      expect(following).toBe(true)
      expect(followedBy).toBe(true)
    })

    it("User B should see both following and followedBy as true when viewing user A's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)

      expect(following).toBe(true)
      expect(followedBy).toBe(true)
    })

    describe("User A sends a tweet", () => {
      let tweet
      const text = chance.string({ length: 16 })
      beforeAll(async () => {
        tweet = await when.a_user_calls_tweet(userA, text)
      })

      it("Should appear in user B's timeline", async () => {
        await retry(async () => {
          const { tweets } = await when.a_user_calls_getMyTimeline(userB, 25)
  
          expect(tweets).toHaveLength(4)
          expect(tweets[0].id).toEqual(tweet.id)
        }, {
          retries: 3,
          maxTimeout: 1000
        })
      })
    })
  })

  describe("When user A unfollows user B", () => {
    beforeAll(async () => {
      await when.a_user_calls_unfollow(userA, userB.username)
    })

    it("User A should see following as false when viewing user B's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userA, userBsProfile.screenName)

      expect(following).toBe(false)
      expect(followedBy).toBe(true)
    })

    it("User B should see followedBy as false when viewing user A's profile", async () => {
      const { following, followedBy } = await when.a_user_calls_getProfile(userB, userAsProfile.screenName)

      expect(following).toBe(true)
      expect(followedBy).toBe(false)
    })

    it("Remove user B's tweets from user A's timeline", async () => {
      retry(async () => {
        const { tweets } = await when.a_user_calls_getMyTimeline(userA, 25)
  
        expect(tweets).toHaveLength(1)
        expect(tweets).toEqual([
          expect.objectContaining({
            profile: {
              id: userA.username
            }
          }),
        ])
      }, {
        retries: 3,
        maxTimeout: 1000
      })
    })
  })
})