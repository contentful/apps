import { DOMParser, Node as XmlNode } from '@xmldom/xmldom';

// The Contentful Functions runtime has no DOM globals; the AWS SDK's browser
// build needs DOMParser and Node (node-type constants) to deserialize S3's
// XML responses.
const g = globalThis as { DOMParser?: unknown; Node?: unknown };
g.DOMParser ??= DOMParser;
g.Node ??= XmlNode;

import { GetObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { AssumeRoleCommand, STSClient } from '@aws-sdk/client-sts';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { FetchHttpHandler } from '@smithy/fetch-http-handler';
import { MAX_FILES, selectLogFiles } from './select';
import type { ListResult, LogStorageProvider, StorageConfig } from './types';

export { MAX_FILES };
const URL_TTL_SECONDS = 900;

/**
 * Contentful Functions do not support node:http/https — every client must use
 * the fetch-based handler. forcePathStyle keeps S3 hostnames bucket-independent
 * so the manifest allowNetworks list stays static.
 */
export async function createS3Client(cfg: StorageConfig): Promise<S3Client> {
  let credentials: { accessKeyId: string; secretAccessKey: string; sessionToken?: string } = {
    accessKeyId: cfg.awsAccessKeyId,
    secretAccessKey: cfg.awsSecretAccessKey,
  };
  if (cfg.roleArn) {
    const sts = new STSClient({
      region: cfg.region,
      credentials,
      requestHandler: new FetchHttpHandler(),
    });
    const assumed = await sts.send(
      new AssumeRoleCommand({
        RoleArn: cfg.roleArn,
        RoleSessionName: 'contentful-audit-log-viewer',
        ExternalId: cfg.externalId || undefined,
        DurationSeconds: 3600,
      })
    );
    if (!assumed.Credentials?.AccessKeyId || !assumed.Credentials.SecretAccessKey) {
      throw new Error('STS AssumeRole returned no credentials');
    }
    credentials = {
      accessKeyId: assumed.Credentials.AccessKeyId,
      secretAccessKey: assumed.Credentials.SecretAccessKey,
      sessionToken: assumed.Credentials.SessionToken,
    };
  }
  return new S3Client({
    region: cfg.region,
    credentials,
    requestHandler: new FetchHttpHandler(),
    forcePathStyle: true,
  });
}

type Deps = {
  getClient?: (cfg: StorageConfig) => Promise<S3Client>;
  presign?: (s3: S3Client, bucket: string, key: string) => Promise<string>;
};

const defaultPresign = (s3: S3Client, bucket: string, key: string) =>
  getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), {
    expiresIn: URL_TTL_SECONDS,
  });

export class S3LogStorage implements LogStorageProvider {
  private readonly getClient: NonNullable<Deps['getClient']>;
  private readonly presign: NonNullable<Deps['presign']>;

  constructor(private readonly cfg: StorageConfig, deps: Deps = {}) {
    this.getClient = deps.getClient ?? createS3Client;
    this.presign = deps.presign ?? defaultPresign;
  }

  async listLogFiles(startDate: string, endDate: string): Promise<ListResult> {
    const s3 = await this.getClient(this.cfg);
    const prefix = `${this.cfg.prefix ?? ''}contentful-audit-`;
    const objects: Array<{ key: string; size: number }> = [];
    let token: string | undefined;
    do {
      const page = await s3.send(
        new ListObjectsV2Command({
          Bucket: this.cfg.bucketName,
          Prefix: prefix,
          ContinuationToken: token,
        })
      );
      for (const obj of page.Contents ?? []) {
        if (obj.Key) objects.push({ key: obj.Key, size: obj.Size ?? 0 });
      }
      token = page.IsTruncated ? page.NextContinuationToken : undefined;
    } while (token);

    const { selected, truncated } = selectLogFiles(objects, startDate, endDate);
    const files = await Promise.all(
      selected.map(async (m) => ({
        ...m,
        url: await this.presign(s3, this.cfg.bucketName, m.key),
      }))
    );
    return { files, truncated };
  }
}
