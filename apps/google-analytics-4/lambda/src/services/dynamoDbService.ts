import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config';
import { decryptSharedCredentials, encryptSharedCredentials } from './dynamoDbUtils';

export interface SharedCredentialsInput {
  sharedCredentialsId: string;
  serviceKey?: object;
}

export class DynamoDBService {
  private dynamoDBDocumentClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(
    client = new DynamoDBClient({
      region: config.awsRegion,
      endpoint: config.dynamoDbEndpoint,
    })
  ) {
    this.dynamoDBDocumentClient = DynamoDBDocumentClient.from(client);
    this.tableName = config.dynamoDbTableName;
  }

  async getSharedCredentials(input: SharedCredentialsInput) {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          sharedCredentialsId: input.sharedCredentialsId,
        },
      });

      const data = await this.dynamoDBDocumentClient.send(command);

      return decryptSharedCredentials(data.Item?.value);
    } catch (err: any) {
      // TODO: refactor error handling for dynamodb specific errors
      throw new Error(err);
    }
  }

  async saveSharedCredentials(input: SharedCredentialsInput) {
    const encryptedCredentials = await encryptSharedCredentials(input.serviceKey!);

    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          sharedCredentialsId: input.sharedCredentialsId,
          value: encryptedCredentials,
        },
      });

      const data = await this.dynamoDBDocumentClient.send(command);

      return data;
    } catch (err: any) {
      // TODO: refactor error handling for dynamodb specific errors
      throw new Error(err);
    }
  }
}
