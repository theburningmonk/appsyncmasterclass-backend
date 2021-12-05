require('dotenv').config()
const AWS = require('aws-sdk')

const providerName = process.env.COGNITO_USER_POOL_PROVIDER_NAME

AWS.config.credentials = new AWS.CognitoIdentityCredentials({
  IdentityPoolId: process.env.COGNITO_IDENTITY_POOL_ID,
  Logins: {
    [providerName]: 'eyJraWQiOiJhdTlUcUxaT0pTZitnRklhRXdJT2NFcG1HTnBMdDBWRUkzUFlIdjdnUW0wPSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiJkMzg3NjY4NS00YTJjLTQ0NzgtYjEwYy0xZDIzN2UzMDAzNDIiLCJhdWQiOiI2bmRmY2piZ2M5Yzc5cjBncDlpMGQ1cDl2diIsImVtYWlsX3ZlcmlmaWVkIjpmYWxzZSwiZXZlbnRfaWQiOiJiYmQ1Yjg5MS1hY2FmLTQ2NWMtOGYxYy01MDA3YzA2MWVkNWYiLCJ0b2tlbl91c2UiOiJpZCIsImF1dGhfdGltZSI6MTYzODY3MTM2MiwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmV1LXdlc3QtMS5hbWF6b25hd3MuY29tXC9ldS13ZXN0LTFfTXNpSXBpbmd4IiwibmFtZSI6IllhbiIsImNvZ25pdG86dXNlcm5hbWUiOiJkMzg3NjY4NS00YTJjLTQ0NzgtYjEwYy0xZDIzN2UzMDAzNDIiLCJleHAiOjE2Mzg2NzQ5NjIsImlhdCI6MTYzODY3MTM2MiwiZW1haWwiOiJ0aGVidXJuaW5nbW9ua0BnbWFpbC5jb20ifQ.UxgPC3wYgyS0Ck_57X7b-G3k_-Ieg6fDyx7utertSYdScJEVDTJXUwPFzqqesKsuHfMkFi2xVO9UgsIslQ0BJUQazCUm4FqOiMEzfCumG2kwr0g2pxF81EHiz0ZkT-24ticGBwPhUGx7OZGjOa-UhOQN354I4H48KBbUOjLVPHqUw16K79ugJJopdNjIbVFzpn6yUCQJ3n34At5xxPFwLDV240AQ4f1C0gjos05N6Z5Qfr_xEi07Psjy-3R_9X4DJjo7vA1GAqBrkPPr4tj9ICl_HmLfhwNgUxXzEcdbvskcZwbqu_zYq7MpyPMO_uqV6MyPewW1d1WyLUEcor7jvw'
  }
})

AWS.config.credentials.get(function() {
  const { accessKeyId, secretAccessKey, sessionToken } = AWS.config.credentials
  process.env.AWS_ACCESS_KEY_ID = accessKeyId
  process.env.AWS_SECRET_ACCESS_KEY = secretAccessKey
  process.env.AWS_SESSION_TOKEN = sessionToken

  const Firehose = new AWS.Firehose()
  Firehose.putRecord({
    DeliveryStreamName: process.env.FIREHOSE_STREAM_NAME,
    Record: {
      Data: JSON.stringify({
        eventType: 'impression',
        tweetId: '123'
      })
    }
  }).promise()
  .then(() => console.log('all done'))
  .catch(err => console.error('failed', err))

})