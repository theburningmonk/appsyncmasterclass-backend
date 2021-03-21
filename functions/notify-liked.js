const DynamoDB = require('aws-sdk/clients/dynamodb')
const graphql = require('graphql-tag')
const { mutate } = require('../lib/graphql')
const ulid = require('ulid')
const { getTweetById } = require('../lib/tweets')

module.exports.handler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const like = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      await notifyLiked(like)
    }
  }
}

async function notifyLiked(like) {
  const tweet = await getTweetById(like.tweetId)
  await mutate(graphql `mutation notifyLiked(
    $id: ID!
    $userId: ID!
    $tweetId: ID!
    $likedBy: ID!
  ) {
    notifyLiked(
      id: $id
      userId: $userId
      tweetId: $tweetId
      likedBy: $likedBy
    ) {
      __typename
      ... on Liked {
        id
        type
        userId
        tweetId
        likedBy
        createdAt
      }
    }
  }`, {
    id: ulid.ulid(),
    userId: tweet.creator,
    tweetId: tweet.id,
    likedBy: like.userId
  })
}