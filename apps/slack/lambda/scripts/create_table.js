const AWS = require('aws-sdk');

const defaultOptions = {
  maxRetries: 3,
  endpoint: process.env.DYNAMO_ENDPOINT,
  tableName: process.env.DYNAMO_TABLE_NAME,
};

const makeDynamoClient = () => {
  return new AWS.DynamoDB(defaultOptions);
};

async function createTable() {
  makeDynamoClient().createTable(
    {
      AttributeDefinitions: [
        {
          AttributeName: 'uuid',
          AttributeType: 'S',
        },
        {
          AttributeName: 'typ',
          AttributeType: 'S',
        },
        {
          AttributeName: 'slackWorkspaceId',
          AttributeType: 'S',
        },
      ],
      KeySchema: [
        {
          AttributeName: 'uuid',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'typ',
          KeyType: 'RANGE',
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
      GlobalSecondaryIndexes: [
        {
          IndexName: 'by-slack-workspace-id',
          KeySchema: [
            {
              AttributeName: 'typ',
              KeyType: 'HASH',
            },
            {
              AttributeName: 'slackWorkspaceId',
              KeyType: 'RANGE',
            },
          ],
          Projection: {
            ProjectionType: 'ALL',
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      TableName: process.env.DYNAMO_TABLE_NAME,
    },
    (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log(`created table ${process.env.DYNAMO_TABLE_NAME}`);
      }
    }
  );
}
createTable();
