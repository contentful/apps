import type { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import type {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import { createStorage } from './lib/storage/factory';
import type { LogStorageProvider, ProviderConfig } from './lib/storage/types';

type ActionParams = { startDate: string; endDate: string };

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const REQUIRED_BY_PROVIDER = {
  s3: ['bucketName', 'region', 'awsAccessKeyId', 'awsSecretAccessKey'],
  azure: ['azureAccountName', 'azureContainerName', 'azureAccountKey'],
  gcs: ['gcsBucketName', 'gcsServiceAccountKey'],
} as const;

function readConfig(params: Record<string, unknown>): ProviderConfig | { configError: string } {
  const p = params as Record<string, string | undefined>;
  const provider = p.provider || 's3';
  if (provider !== 's3' && provider !== 'azure' && provider !== 'gcs') {
    return { configError: `Unknown storage provider "${provider}"` };
  }
  for (const key of REQUIRED_BY_PROVIDER[provider]) {
    if (typeof p[key] !== 'string' || p[key] === '') {
      return { configError: `App is not configured: missing installation parameter "${key}"` };
    }
  }
  if (provider === 'gcs') {
    try {
      const parsed = JSON.parse(p.gcsServiceAccountKey!);
      if (!parsed.client_email || !parsed.private_key) throw new Error('missing fields');
    } catch {
      return {
        configError:
          'gcsServiceAccountKey is not valid service-account JSON (expected client_email and private_key)',
      };
    }
  }
  const prefix = p.prefix || undefined;
  if (provider === 'azure') {
    return {
      provider,
      azureAccountName: p.azureAccountName!,
      azureContainerName: p.azureContainerName!,
      azureAccountKey: p.azureAccountKey!,
      prefix,
    };
  }
  if (provider === 'gcs') {
    return { provider, gcsBucketName: p.gcsBucketName!, gcsServiceAccountKey: p.gcsServiceAccountKey!, prefix };
  }
  return {
    provider,
    bucketName: p.bucketName!,
    region: p.region!,
    prefix,
    roleArn: p.roleArn || undefined,
    externalId: p.externalId || undefined,
    awsAccessKeyId: p.awsAccessKeyId!,
    awsSecretAccessKey: p.awsSecretAccessKey!,
  };
}

type StorageFactory = (cfg: ProviderConfig) => LogStorageProvider;

export const makeHandler =
  (storageFactory: StorageFactory = createStorage): FunctionEventHandler<FunctionTypeEnum.AppActionCall> =>
  async (event: AppActionRequest<'Custom', ActionParams>, context: FunctionEventContext) => {
    try {
      const { startDate, endDate } = (event.body ?? {}) as Partial<ActionParams>;
      if (!DATE_RE.test(startDate ?? '') || !DATE_RE.test(endDate ?? '')) {
        return { ok: false, error: 'startDate and endDate must be YYYY-MM-DD' };
      }
      if (startDate! > endDate!) {
        return { ok: false, error: 'startDate must not be after endDate' };
      }
      const cfg = readConfig(context.appInstallationParameters);
      if ('configError' in cfg) return { ok: false, error: cfg.configError };
      const { files, truncated } = await storageFactory(cfg).listLogFiles(startDate!, endDate!);
      return { ok: true, files, truncated };
    } catch (e) {
      // Message only — no stack, no config echo, so nothing sensitive reaches the browser.
      return { ok: false, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
    }
  };

export const handler = makeHandler();
