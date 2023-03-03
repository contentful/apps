import { RequestHandler } from 'express';
import { ServiceAccountKeyFile, ServiceAccountKeyId } from '../types';

export class MissingServiceAccountKeyHeader extends Error {}
export class InvalidServiceAccountKey extends Error {}

export const serviceAccountKeyProvider: RequestHandler = (req, _res, next) => {
  const serviceAccountKeyIdHeaderValue = req.header('X-Contentful-ServiceAccountKeyId');
  if (!serviceAccountKeyIdHeaderValue || typeof serviceAccountKeyIdHeaderValue !== 'string') {
    throw new MissingServiceAccountKeyHeader(
      "missing or incorrectly formatted header 'X-Contentful-ServiceAccountKeyId'"
    );
  }
  const serviceAccountKeyId = decodeServiceAccountHeader(serviceAccountKeyIdHeaderValue);
  assertServiceAccountKeyId(serviceAccountKeyId);
  req.serviceAccountKeyId = serviceAccountKeyId;

  // Pulling the account key from the header will be removed later and replaced with fetching
  // the code directly from secret storage!
  const serviceAccountKeyHeaderValue = req.header('X-Contentful-ServiceAccountKey');
  if (!serviceAccountKeyHeaderValue || typeof serviceAccountKeyHeaderValue !== 'string') {
    throw new MissingServiceAccountKeyHeader(
      "missing or incorrectly formatted header 'X-Contentful-ServiceAccountKey'"
    );
  }
  const serviceAccountKey = decodeServiceAccountHeader(serviceAccountKeyHeaderValue);
  assertServiceAccountKeyFile(serviceAccountKey);
  req.serviceAccountKey = serviceAccountKey;

  next();
};

const decodeServiceAccountHeader = (value: string) => {
  const asciiStr = Buffer.from(value, 'base64').toString('ascii');
  try {
    return JSON.parse(asciiStr);
  } catch (e) {
    throw new InvalidServiceAccountKey('Improperly formatted service account key', { cause: e });
  }
};

function assertServiceAccountKeyId(value: unknown): asserts value is ServiceAccountKeyId {
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
function assertServiceAccountKeyFile(value: unknown): asserts value is ServiceAccountKeyFile {
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
    serviceAccountKey?: ServiceAccountKeyFile;
    serviceAccountKeyId?: ServiceAccountKeyId;
  }
}
