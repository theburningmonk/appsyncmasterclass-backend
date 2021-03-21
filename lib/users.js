const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()

const { USERS_TABLE } = process.env

const getUserByScreenName = async (screenName) => {
  const resp = await DocumentClient.query({
    TableName: USERS_TABLE,
    KeyConditionExpression: 'screenName = :screenName',
    ExpressionAttributeValues: {
      ':screenName': screenName
    },
    IndexName: 'byScreenName',
    Limit: 1
  }).promise()

  return _.get(resp, 'Items.0')
}

module.exports = {
  getUserByScreenName
}
