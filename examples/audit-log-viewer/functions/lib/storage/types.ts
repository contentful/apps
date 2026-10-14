export interface LogFileRef {
  key: string;
  url: string;
  size: number;
  /** YYYY-MM-DD day the file's events belong to (filename date minus one day) */
  coveredDate: string;
}

export interface ListResult {
  files: LogFileRef[];
  truncated: boolean;
}

export interface LogStorageProvider {
  listLogFiles(startDate: string, endDate: string): Promise<ListResult>;
}

export interface StorageConfig {
  bucketName: string;
  region: string;
  prefix?: string;
  roleArn?: string;
  externalId?: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
}

export interface AzureConfig {
  azureAccountName: string;
  azureContainerName: string;
  prefix?: string;
  azureAccountKey: string; // base64 account key — Secret installation parameter
}

export interface GcsConfig {
  gcsBucketName: string;
  prefix?: string;
  gcsServiceAccountKey: string; // full service-account JSON — Secret installation parameter
}

export type ProviderConfig =
  | ({ provider: 's3' } & StorageConfig)
  | ({ provider: 'azure' } & AzureConfig)
  | ({ provider: 'gcs' } & GcsConfig);
