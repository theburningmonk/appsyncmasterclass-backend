const DynamoDB = require('aws-sdk/clients/dynamodb')
const graphql = require('graphql-tag')
const { mutate } = require('../lib/graphql')
const ulid = require('ulid')

module.exports.handler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const dm = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      await notifyDMed(dm)
    }
  }
}

async function notifyDMed(dm) {
  const userIds = dm.conversationId.split('_')
  const userId = userIds.filter(x => x != dm.from)[0]

  await mutate(graphql `mutation notifyDMed(
    $id: ID!
    $userId: ID!
    $otherUserId: ID!
    $message: String!
  ) {
    notifyDMed(
      id: $id
      userId: $userId
      otherUserId: $otherUserId
      message: $message
    ) {
      __typename
      ... on DMed {
        id
        type
        userId
        createdAt
        otherUserId
        message
      }
    }
  }`, {
    id: ulid.ulid(),
    userId: userId,
    otherUserId: dm.from,
    message: dm.message
  })
}