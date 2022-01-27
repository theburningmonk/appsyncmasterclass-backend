const AppSync = require('aws-sdk/clients/appsync')
const AppSyncClient = new AppSync()

const { APPSYNC_API_ID, FIELD_LOG_LEVEL } = process.env

module.exports.handler = async () => {
  const resp = await AppSyncClient.getGraphqlApi({
    apiId: APPSYNC_API_ID
  }).promise()

  const api = resp.graphqlApi
  api.logConfig.fieldLogLevel = FIELD_LOG_LEVEL

  delete api.arn
  delete api.uris
  delete api.tags
  delete api.wafWebAclArn

  await AppSyncClient.updateGraphqlApi(api).promise()
}
