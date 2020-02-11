'use strict';

const { promisify } = require('util');

const AWS = require('aws-sdk');

module.exports = async spaceId => {
  const ddb = new AWS.DynamoDB();
  const updateItem = promisify(ddb.updateItem.bind(ddb));

  const now = new Date();
  const year = `${now.getFullYear()}`;
  const month = `${now.getMonth()+1}`;
  const formattedMonth = month.length === 1 ? `0${month}` : month;
  const period = [year, formattedMonth].join('-');

  const { Attributes } = await updateItem({
    TableName: process.env.TABLE_NAME,
    Key: {
      period: { S: period },
      spaceId: { S: spaceId }
    },
    UpdateExpression: 'SET #attr = if_not_exists(#attr, :zero) + :incr',
    ExpressionAttributeNames: { '#attr': 'reqs' },
    ExpressionAttributeValues: {
      ':incr': { N: '1' },
      ':zero': { N: '0' }
    },
    ReturnValues: 'ALL_NEW'
  });

  const reqs = Attributes && Attributes.reqs && Attributes.reqs.N;

  if (reqs) {
    return parseInt(reqs, 10);
  } else {
    throw new Error(`Failed to report usage for ${spaceId}.`);
  }
}
