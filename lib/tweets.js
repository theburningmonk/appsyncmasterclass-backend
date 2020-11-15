const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()
const { TweetTypes } = require('../lib/constants')

const { TWEETS_TABLE } = process.env

const getTweetById = async (tweetId) => {
  const resp = await DocumentClient.get({
    TableName: TWEETS_TABLE,
    Key: {
      id: tweetId
    }
  }).promise()

  return resp.Item
}

module.exports = {
  getTweetById
}