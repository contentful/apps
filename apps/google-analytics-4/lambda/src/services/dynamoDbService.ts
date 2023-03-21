import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config';
import { decryptSharedCredentials, encryptSharedCredentials } from './dynamoDbUtils';
import { DynamoDbSharedCredentials, ServiceAccountKeyFile } from '../types';

export interface SharedCredentialsInput {
  sharedCredentialsId: string;
  serviceKey: ServiceAccountKeyFile;
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

  async getSharedCredentials(sharedCredentialsId: string): Promise<ServiceAccountKeyFile | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: {
        sharedCredentialsId,
      },
    });

    const data = await this.dynamoDBDocumentClient.send(command);

    // TODO: make sure we understand the shape of this object under all contexts
    if (!data.Item) return null;

    return decryptSharedCredentials(data.Item?.value);
  }

  async saveSharedCredentials(input: SharedCredentialsInput) {
    const encryptedCredentials = await encryptSharedCredentials(input.serviceKey);

    const command = new PutCommand({
      TableName: this.tableName,
      Item: {
        sharedCredentialsId: input.sharedCredentialsId,
        value: encryptedCredentials,
      },
    });

    const data = await this.dynamoDBDocumentClient.send(command);

    return data;
  }
}
