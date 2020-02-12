'use strict';

const AWS = require('aws-sdk');

const { DateTime } = require('luxon');

const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports = async spaceId => {
  const now = new Date();
  const period = DateTime.utc().startOf('month').toSeconds()
    year: now.getUTCFullYear(),
    month: now.getUTCMonth() + 1,
    day: 1,
    zone: 'utc'
  });
  const period = dt.startOf('month').toMillis() / 1000;

  const { Attributes } = await documentClient.update({
    TableName: process.env.TABLE_NAME,
    Key: { period, spaceId },
    UpdateExpression: 'SET #attr = if_not_exists(#attr, :zero) + :incr',
    ExpressionAttributeNames: { '#attr': 'reqs' },
    ExpressionAttributeValues: { ':incr': 1, ':zero': 0 },
    ReturnValues: 'ALL_NEW'
  }).promise();

  const reqs = Attributes && Attributes.reqs;

  if (!reqs) {
    throw new Error(`Failed to report usage for ${spaceId}.`);
  }

  return [reqs, period];
}
