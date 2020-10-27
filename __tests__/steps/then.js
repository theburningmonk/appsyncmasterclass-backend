require('dotenv').config()
const AWS = require('aws-sdk')

const user_exists_in_UsersTable = async (id) => {
  const DynamoDB = new AWS.DynamoDB.DocumentClient()

  console.log(`looking for user [${id}] in table [${process.env.USERS_TABLE}]`)
  const resp = await DynamoDB.get({
    TableName: process.env.USERS_TABLE,
    Key: {
      id
    }
  }).promise()

  expect(resp.Item).toBeTruthy()

  return resp.Item
}

module.exports = {
  user_exists_in_UsersTable
}