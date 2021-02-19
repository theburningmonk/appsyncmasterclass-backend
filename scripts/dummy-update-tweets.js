const AWS = require('aws-sdk')
AWS.config.region = 'eu-west-1'
const DynamoDB = new AWS.DynamoDB.DocumentClient()

const { resolve } = require('path')
require('dotenv').config({
  path: resolve(__dirname, '../.env'),
})

const run = async () => {
  const loop = async (exclusiveStartKey) => {
    const resp = await DynamoDB.scan({
      TableName: process.env.TWEETS_TABLE,
      ExclusiveStartKey: exclusiveStartKey,
      Limit: 100
    }).promise()

    const promises = resp.Items.map(async x => {
      await DynamoDB.update({
        TableName: process.env.TWEETS_TABLE,
        Key: {
          id: x.id
        },
        UpdateExpression: "SET lastUpdated = :now",
        ExpressionAttributeValues: {
          ":now": new Date().toJSON()
        }
      }).promise()
    })
    await Promise.all(promises)

    if (resp.LastEvaluatedKey) {
      return await loop(resp.LastEvaluatedKey)
    }
  }

  await loop()
}

run().then(x => console.log('all done'))
