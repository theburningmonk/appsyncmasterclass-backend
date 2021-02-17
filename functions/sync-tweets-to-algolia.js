const { initTweetsIndex } = require('../lib/algolia')
const { TweetTypes } = require('../lib/constants')

const { STAGE, ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY } = process.env

module.exports.handler = async (event) => {
  const index = await initTweetsIndex(ALGOLIA_APP_ID, ALGOLIA_WRITE_KEY, STAGE)

  for (const record of event.Records) {
    if (record.eventName === 'INSERT' || record.eventName === 'MODIFY') {
      const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)

      if (tweet.__typename === TweetTypes.RETWEET) {
        continue
      }
      
      tweet.objectID = tweet.id

      await index.saveObjects([tweet])
    } else if (record.eventName === 'REMOVE') {
      const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.OldImage)

      if (tweet.__typename === TweetTypes.RETWEET) {
        continue
      }

      await index.deleteObjects([tweet.id])
    }
  }
}