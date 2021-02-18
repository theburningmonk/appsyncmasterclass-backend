const DynamoDB = require('aws-sdk/clients/dynamodb')
const { initUsersIndex } = require('../lib/algolia')
const middy = require('@middy/core')
const ssm = require('@middy/ssm')

const { STAGE } = process.env

module.exports.handler = middy(async (event, context) => {
  const index = await initUsersIndex(
    context.ALGOLIA_APP_ID, context.ALGOLIA_WRITE_KEY, STAGE)

  for (const record of event.Records) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      const profile = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      
      profile.objectID = profile.id

      await index.saveObjects([profile])
    } else if (record.eventName === 'REMOVE') {
      const profile = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage)

      await index.deleteObjects([profile.id])
    }
  }
}).use(ssm({
  cache: true,
  cacheExpiryInMillis: 5 * 60 * 1000, // 5 mins
  names: {
    ALGOLIA_APP_ID: `/${STAGE}/algolia-app-id`,
    ALGOLIA_WRITE_KEY: `/${STAGE}/algolia-admin-key`
  },
  setToContext: true,
  throwOnFailedCall: true
}))