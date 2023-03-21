import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { config } from '../config';
import { decrypt, encrypt } from './dynamoDbUtils';
import { ServiceAccountKeyFile, ServiceAccountKeyId } from '../types';
import { assertServiceAccountKey } from '../middlewares/serviceAccountKeyProvider';

export class DynamoDBService {
  private dynamoDBDocumentClient: DynamoDBDocumentClient;

  constructor(
    client = new DynamoDBClient({
      region: config.awsRegion,
      endpoint: config.dynamoDbEndpoint,
    })
  ) {
    this.dynamoDBDocumentClient = DynamoDBDocumentClient.from(client);
  }

  constructTableRecordId(spaceId: string, serviceAccountKeyId: ServiceAccountKeyId): string {
    return `${spaceId}-${serviceAccountKeyId.id}`;
  }

  async getServiceAccountKeyFile(
    spaceId: string,
    serviceAccountKeyId: ServiceAccountKeyId
  ): Promise<ServiceAccountKeyFile | null> {
    const command = new GetCommand({
      TableName: config.dynamoDbTableName,
      Key: {
        id: this.constructTableRecordId(spaceId, serviceAccountKeyId),
      },
    });

    const data = await this.dynamoDBDocumentClient.send(command);

    if (!data.Item) return null;

    const decryptedServiceAccountKeyFile = decrypt(
      data.Item.encryptedServiceAccountKeyFile,
      config.serviceAccountKeyEncryptionSecret
    );

    assertServiceAccountKey(decryptedServiceAccountKeyFile);

    return decryptedServiceAccountKeyFile;
  }

  async saveServiceAccountKeyFile(
    spaceId: string,
    serviceAccountKeyId: ServiceAccountKeyId,
    serviceAccountKeyFile: ServiceAccountKeyFile
  ): Promise<void> {
    if (serviceAccountKeyFile.private_key_id !== serviceAccountKeyId.id) {
      throw new Error('Service Account Key ID does not match Service Account Key File!');
    }

    const encryptedServiceAccountKeyFile = await encrypt(
      serviceAccountKeyFile,
      config.serviceAccountKeyEncryptionSecret
    );

    const command = new PutCommand({
      TableName: config.dynamoDbTableName,
      Item: {
        id: this.constructTableRecordId(spaceId, serviceAccountKeyId),
        encryptedServiceAccountKeyFile,
      },
    });

    await this.dynamoDBDocumentClient.send(command);
  }
}
