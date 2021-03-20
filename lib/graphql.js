require('isomorphic-fetch')
const AWS = require('aws-sdk/global')
const { AWSAppSyncClient, AUTH_TYPE } = require('aws-appsync')

const { GRAPHQL_API_URL, AWS_REGION } = process.env
const config = {
  url: GRAPHQL_API_URL,
  region: AWS_REGION,
  auth: {
    type: AUTH_TYPE.AWS_IAM,
    credentials: AWS.config.credentials
  },
  disableOffline: true
}
const appSyncClient = new AWSAppSyncClient(config)

async function mutate(query, variables) {
  await appSyncClient.mutate({
    mutation: query,
    variables
  })
}

module.exports = {
  mutate
}