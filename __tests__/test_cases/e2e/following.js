require('dotenv').config()
const given = require('../../steps/given')
const when = require('../../steps/when')

describe('Given authenticated users, user A and B', () => {
  let userA, userB, userAsProfile, userBsProfile
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userB = await given.an_authenticated_user()
    userAsProfile = await when.a_user_calls_getMyProfile(userA)
    userBsProfile = await when.a_user_calls_getMyProfile(userB)
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
  })
})