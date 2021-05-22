const given = require('../../steps/given')
const when = require('../../steps/when')
const then = require('../../steps/then')
const chance = require('chance').Chance()

describe(`Given two authenticated users`, () => {
  let userA, userB
  beforeAll(async () => {
    userA = await given.an_authenticated_user()
    userB = await given.an_authenticated_user()
  })

  describe('When user A sends a DM to user B', () => {
    let conversation
    const text = chance.string({ length: 16 })
    beforeAll(async () => {
      conversation = await when.we_invoke_sendDirectMessage(userA.username, userB.username, text)
    })

    it('Saves the message in the DirectMessages table', async () => {
      const [ message ] = await then.there_are_N_messages_in_DirectMessagesTable(conversation.id, 1)

      expect(message).toMatchObject({
        conversationId: conversation.id,
        message: text,
        from: userA.username
      })
    })

    it('Saves the conversation in the Conversations table for both user A and user B', async () => {
      await then.conversation_exists_in_ConversationsTable(userA.username, userB.username)
      await then.conversation_exists_in_ConversationsTable(userB.username, userA.username)
    })
  })  
})
