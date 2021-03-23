const _ = require('lodash')
const DynamoDB = require('aws-sdk/clients/dynamodb')
const { TweetTypes } = require('../lib/constants')
const graphql = require('graphql-tag')
const { mutate } = require('../lib/graphql')
const ulid = require('ulid')
const { getTweetById, extractMentions } = require('../lib/tweets')
const { getUserByScreenName } = require('../lib/users')

module.exports.handler = async (event) => {
  for (const record of event.Records) {
    if (record.eventName === 'INSERT') {
      const tweet = DynamoDB.Converter.unmarshall(record.dynamodb.NewImage)
      
      switch (tweet.__typename) {
        case TweetTypes.RETWEET:
          await notifyRetweet(tweet)
          break
        case TweetTypes.REPLY:
          await notifyReply(tweet.inReplyToUserIds, tweet)
          break
      }

      if (tweet.text) {
        const mentions = extractMentions(tweet.text)
        if (!_.isEmpty(mentions)) {
          await notifyMentioned(mentions, tweet)
        }
      }
    }
  }
}

async function notifyRetweet(tweet) {
  const retweetOf = await getTweetById(tweet.retweetOf)
  await mutate(graphql `mutation notifyRetweeted(
    $id: ID!
    $userId: ID!
    $tweetId: ID!
    $retweetedBy: ID!
    $retweetId: ID!
  ) {
    notifyRetweeted(
      id: $id
      userId: $userId
      tweetId: $tweetId
      retweetedBy: $retweetedBy
      retweetId: $retweetId
    ) {
      __typename
      ... on Retweeted {
        id
        type
        userId
        tweetId
        retweetedBy
        retweetId
        createdAt
      }
    }
  }`, {
    id: ulid.ulid(),
    userId: retweetOf.creator,
    tweetId: tweet.retweetOf,
    retweetId: tweet.id,
    retweetedBy: tweet.creator
  })
}

async function notifyReply(userIds, tweet) {
  const promises = userIds.map(userId => 
    mutate(graphql `mutation notifyReplied(
      $id: ID!
      $userId: ID!
      $tweetId: ID!
      $replyTweetId: ID!
      $repliedBy: ID!
    ) {
      notifyReplied(
        id: $id
        userId: $userId
        tweetId: $tweetId
        replyTweetId: $replyTweetId
        repliedBy: $repliedBy
      ) {
        __typename
        ... on Replied {
          id
          type
          userId
          tweetId
          repliedBy
          replyTweetId
          createdAt
        }
      }
    }`, {
      id: ulid.ulid(),
      userId,
      tweetId: tweet.inReplyToTweetId,
      replyTweetId: tweet.id,
      repliedBy: tweet.creator
    })
  )

  await Promise.all(promises)
}

async function notifyMentioned(screenNames, tweet) {
  const promises = screenNames.map(async (screenName) => {
    const user = await getUserByScreenName(screenName.replace('@', ''))
    if (!user) {
      return
    }

    await mutate(graphql `mutation notifyMentioned(
      $id: ID!
      $userId: ID!
      $mentionedBy: ID!
      $mentionedByTweetId: ID!
    ) {
      notifyMentioned(
        id: $id
        userId: $userId
        mentionedBy: $mentionedBy
        mentionedByTweetId: $mentionedByTweetId
      ) {
        __typename
        ... on Mentioned {
          id
          type
          userId
          mentionedBy
          mentionedByTweetId
          createdAt
        }
      }
    }`, {
      id: ulid.ulid(),
      userId: user.id,
      mentionedBy: tweet.creator,
      mentionedByTweetId: tweet.id
    })
  })
  
  await Promise.all(promises)
}