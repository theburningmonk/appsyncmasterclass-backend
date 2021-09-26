const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const DocumentClient = new DynamoDB.DocumentClient()

const { USERS_TABLE } = process.env

module.exports.handler = async (payloads) => {
  const { caller, selection } = payloads[0]
  const userIds = payloads.map(x => x.userId)

  if (selection.length === 1 && selection[0] === 'id') {
    return userIds.map(id => ({
      id,
      __typename: id === caller ? 'MyProfile' : 'OtherProfile'
    }))
  }

  const uniqUserIds = _.uniq(userIds)

  const resp = await DocumentClient.batchGet({
    RequestItems: {
      [USERS_TABLE]: {
        Keys: uniqUserIds.map(x => ({ id: x }))
      }
    }
  }).promise()

  const users = resp.Responses[USERS_TABLE]
  users.forEach(user => {
    if (user.id === caller) {
      user.__typename = 'MyProfile'
    } else {
      user.__typename = 'OtherProfile'
    }
  })

  // { data, errorMessage, errorType }
  return userIds.map(id => {
    const user = _.find(users, { id })
    if (user) {
      return { data: user }
    } else {
      return { errorType: 'UserNotFound', errorMessage: 'User is not found.' }
    }
  })
}