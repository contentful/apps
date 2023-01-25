import * as AWS from 'aws-sdk';
import { DynamoConfiguration } from '../config';

interface DynamoOptions {
  endpoint?: string;
  httpOptions: {
    timeout: number;
  };
}

const TWO_MINUTES = 120000; // This is also AWS SDK default

const prepareOptions = (config: DynamoConfiguration): DynamoOptions => {
  const defaultOptions = {
    maxRetries: 3,
    httpOptions: {
      timeout: config.timeout ?? TWO_MINUTES,
    },
  };

  return config.endpoint ? { ...defaultOptions, endpoint: config.endpoint } : defaultOptions;
};

export const makeDynamoDocumentClient = (
  config: DynamoConfiguration
): AWS.DynamoDB.DocumentClient => {
  return new AWS.DynamoDB.DocumentClient(prepareOptions(config));
};

export const makeDynamoClient = (config: DynamoConfiguration): AWS.DynamoDB => {
  return new AWS.DynamoDB(prepareOptions(config));
};
