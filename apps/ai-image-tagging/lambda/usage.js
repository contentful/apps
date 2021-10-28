'use strict';

const { DateTime } = require('luxon');

module.exports = async (spaceId, documentClient) => {
  const period = DateTime.utc().startOf('month').toSeconds();

  const { Attributes } = await documentClient
    .update({
      TableName: process.env.TABLE_NAME,
      Key: { period, spaceId },
      UpdateExpression: 'SET #attr = if_not_exists(#attr, :zero) + :incr',
      ExpressionAttributeNames: { '#attr': 'reqs' },
      ExpressionAttributeValues: { ':incr': 1, ':zero': 0 },
      ReturnValues: 'ALL_NEW',
    })
    .promise();

  const reqs = Attributes && Attributes.reqs;

  if (!reqs) {
    throw new Error(`Failed to report usage for ${spaceId}.`);
  }

  return [reqs, period];
};
