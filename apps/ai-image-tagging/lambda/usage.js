'use strict';

const AWS = require('aws-sdk');

const documentClient = new AWS.DynamoDB.DocumentClient();

module.exports = async spaceId => {
  const now = new Date();
  const year = `${now.getFullYear()}`;
  const month = `${now.getMonth()+1}`;
  const formattedMonth = month.length === 1 ? `0${month}` : month;
  const period = [year, formattedMonth].join('-');

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

  return reqs;
}
