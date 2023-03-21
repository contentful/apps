import { RequestHandler } from 'express';
import { ServiceAccountKeyFile, ServiceAccountKeyId } from '../types';
import { DynamoDBService } from '../services/dynamoDbService';

export class MissingServiceAccountKeyHeader extends Error {}
export class MissingServiceAccountKeyFile extends Error {}
export class InvalidServiceAccountKey extends Error {}

export const serviceAccountKeyProvider: RequestHandler = async (req, _res, next) => {
  try {
    const serviceAccountKeyIdHeaderValue = req.header('X-Contentful-ServiceAccountKeyId');
    if (!serviceAccountKeyIdHeaderValue || typeof serviceAccountKeyIdHeaderValue !== 'string') {
      throw new MissingServiceAccountKeyHeader(
        "missing or incorrectly formatted header 'X-Contentful-ServiceAccountKeyId'"
      );
    }
    const serviceAccountKeyId = decodeServiceAccountHeader(serviceAccountKeyIdHeaderValue);
    assertServiceAccountKeyId(serviceAccountKeyId);
    req.serviceAccountKeyId = serviceAccountKeyId;

    // fetch and decrypt serviceAccountKey from dynamoDB and add it to the request
    const dynamoDB = new DynamoDBService();
    const spaceId = req.header('X-Contentful-Space-Id');
    const sharedCredentialsId = `${spaceId}-${serviceAccountKeyId}`;
    const serviceAccountKey = await dynamoDB.getSharedCredentials(sharedCredentialsId);
    if (serviceAccountKey !== null) {
      assertServiceAccountKey(serviceAccountKey);
      req.serviceAccountKey = serviceAccountKey;
    }

    next();
  } catch (err) {
    next(err);
  }
};

export const decodeServiceAccountHeader = (value: string) => {
  const asciiStr = Buffer.from(value, 'base64').toString('ascii');
  try {
    return JSON.parse(asciiStr);
  } catch (e) {
    throw new InvalidServiceAccountKey('Improperly formatted service account key', { cause: e });
  }
};

export function assertServiceAccountKeyId(value: unknown): asserts value is ServiceAccountKeyId {
  const requiredFields = ['clientEmail', 'projectId', 'id'];
  for (const requiredField of requiredFields) {
    if (!value || typeof value !== 'object' || !(requiredField in value)) {
      throw new InvalidServiceAccountKey(
        `'${requiredField}' is missing from Service Account Key Id header`
      );
    }

    // @ts-expect-error we just confirmed above that requiredField is in value
    if (typeof value[requiredField] !== 'string') {
      throw new InvalidServiceAccountKey(
        `'${requiredField}' must be a string in Service Account Key Id header`
      );
    }
  }
}

// This function will be removed when we transition to using secret storage
export function assertServiceAccountKey(value: unknown): asserts value is ServiceAccountKeyFile {
  const requiredFields = ['client_email', 'project_id', 'private_key'];
  for (const requiredField of requiredFields) {
    if (!value || typeof value !== 'object' || !(requiredField in value)) {
      throw new InvalidServiceAccountKey(`'${requiredField}' is missing from Service Account Key`);
    }

    // @ts-expect-error we just confirmed above that requiredField is in value
    if (typeof value[requiredField] !== 'string') {
      throw new InvalidServiceAccountKey(
        `'${requiredField}' must be a string in Service Account Key`
      );
    }
  }
}

declare module 'http' {
  interface IncomingMessage {
    serviceAccountKeyId?: ServiceAccountKeyId;
    serviceAccountKey?: ServiceAccountKeyFile;
  }
}
