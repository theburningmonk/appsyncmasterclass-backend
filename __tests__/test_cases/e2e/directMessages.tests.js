const given = require('../../steps/given')
const when = require('../../steps/when')
const chance = require('chance').Chance()

describe(`Given two authenticated users`, () => {
  let userA, userB

  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userB = await given.an_authenticated_user()
  })

  describe("When User A sends a DM to User B", () => {
    let conversation
    const message = chance.string({ length: 16 })
    beforeAll(async () => {
      conversation = await when.a_user_calls_sendDirectMessage(userA, userB.username, message)
    })

    it("The conversation's lastMessage should be user A's message", () => {
      expect(conversation.lastMessage).toEqual(message)
    })

    it("User A should see the conversation when he calls listConversations", async () => {
      const { conversations, nextToken } = await when.a_user_calls_listConversations(userA, 10)

      expect(nextToken).toBeNull()
      expect(conversations).toHaveLength(1)
      expect(conversations[0]).toEqual(conversation)
    })

    it("User B should see the conversation when he calls listConversations", async () => {
      const { conversations, nextToken } = await when.a_user_calls_listConversations(userB, 10)

      expect(nextToken).toBeNull()
      expect(conversations).toHaveLength(1)
      expect(conversations[0]).toMatchObject({
        id: conversation.id,
        lastMessage: message,
        lastModified: conversation.lastModified,
        otherUser: {
          id: userA.username
        }
      })
    })

    it("User A should see the message when he calls getDirectMessages for the conversation", async () => {
      const { messages, nextToken } = await when.a_user_calls_getDirectMessages(userA, userB.username, 10)

      expect(nextToken).toBeNull()
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        from: {
          id: userA.username
        },
        message,
      })
    })

    it("User B should see the message when he calls getDirectMessages for the conversation", async () => {
      const { messages, nextToken } = await when.a_user_calls_getDirectMessages(userB, userA.username, 10)

      expect(nextToken).toBeNull()
      expect(messages).toHaveLength(1)
      expect(messages[0]).toMatchObject({
        from: {
          id: userA.username
        },
        message,
      })
    })

    describe("When User B sends a DM to User A", () => {
      let conversation2
      const message2 = chance.string({ length: 16 })
      beforeAll(async () => {
        conversation2 = await when.a_user_calls_sendDirectMessage(userB, userA.username, message2)
      })

      it("The conversation's lastMessage and lastModified should be updated", () => {
        expect(conversation2.lastMessage).toEqual(message2)
        expect(conversation2.lastModified > conversation.lastModified).toBe(true)
      })

      it("User A should see the updated conversation when he calls listConversations", async () => {
        const { conversations, nextToken } = await when.a_user_calls_listConversations(userA, 10)
  
        expect(nextToken).toBeNull()
        expect(conversations).toHaveLength(1)
        expect(conversations[0]).toMatchObject({
          id: conversation.id,
          lastMessage: message2,
          lastModified: conversation2.lastModified,
          otherUser: {
            id: userB.username
          }
        })
      })
  
      it("User B should see the updated conversation when he calls listConversations", async () => {
        const { conversations, nextToken } = await when.a_user_calls_listConversations(userB, 10)
  
        expect(nextToken).toBeNull()
        expect(conversations).toHaveLength(1)
        expect(conversations[0]).toMatchObject(conversation2)
      })

      it("User A should see the new message when he calls getDirectMessages for the conversation", async () => {
        const { messages, nextToken } = await when.a_user_calls_getDirectMessages(userA, userB.username, 10)
  
        expect(nextToken).toBeNull()
        expect(messages).toHaveLength(2)
        expect(messages[0]).toMatchObject({
          from: {
            id: userB.username
          },
          message: message2,
        })
      })
  
      it("User B should see the message when he calls getDirectMessages for the conversation", async () => {
        const { messages, nextToken } = await when.a_user_calls_getDirectMessages(userB, userA.username, 10)
  
        expect(nextToken).toBeNull()
        expect(messages).toHaveLength(2)
        expect(messages[0]).toMatchObject({
          from: {
            id: userB.username
          },
          message: message2,
        })
      })
    })
  })
})
