'use strict';

const reportUsage = require('./usage');

const { documentClient } = require('./mocks');

describe('usage', () => {
  const OriginalDate = global.Date;
  const originalEnv = { ...process.env };
  afterEach(() => {
    global.Date = OriginalDate;
    process.env = originalEnv;
  });

  test('reports usage', async () => {
    global.Date = class extends OriginalDate {
      constructor () {
        return new OriginalDate(2015, 1, 15);
      }
    };
    process.env.TABLE_NAME = 'some-usage-table';

    const [count, period] = await reportUsage('some-space', documentClient);

    expect(count).toBe(7);
    expect(period).toBe(1422748800);

    expect(documentClient.update).toBeCalledTimes(1);
    expect(documentClient.update).toBeCalledWith({
      TableName: 'some-usage-table',
      Key: { period, spaceId: 'some-space' },
      UpdateExpression: 'SET #attr = if_not_exists(#attr, :zero) + :incr',
      ExpressionAttributeNames: { '#attr': 'reqs' },
      ExpressionAttributeValues: { ':incr': 1, ':zero': 0 },
      ReturnValues: 'ALL_NEW'
    });
  });
});
