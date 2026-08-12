import { AzureLogStorage } from './azure';
import { GcsLogStorage } from './gcs';
import { S3LogStorage } from './s3';
import type { LogStorageProvider, ProviderConfig } from './types';

/** Single seam through which the handler obtains a provider. */
export function createStorage(cfg: ProviderConfig): LogStorageProvider {
  switch (cfg.provider) {
    case 's3':
      return new S3LogStorage(cfg);
    case 'azure':
      return new AzureLogStorage(cfg);
    case 'gcs':
      return new GcsLogStorage(cfg);
  }
}
