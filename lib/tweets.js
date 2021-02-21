const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()

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

const extractHashTags = (text) => {
  const hashTags = new Set()
  const regex = /(\#[a-zA-Z0-9_]+\b)/gm
  while ((m = regex.exec(text)) !== null) {
    // this is necessary to avoid infinite loops with zero-width matches
    if (m.index === regex.lastIndex) {
      regex.lastIndex++
    }

    m.forEach(match => hashTags.add(match))
  }

  return Array.from(hashTags)
}

module.exports = {
  getTweetById,
  extractHashTags
}