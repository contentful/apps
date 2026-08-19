// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { makeHandler } from '../auditLogBroker';

const goodParams = {
  bucketName: 'b',
  region: 'eu-west-1',
  awsAccessKeyId: 'AKIA',
  awsSecretAccessKey: 's',
};

const event = (body: Record<string, unknown>) =>
  ({ type: 'appaction.call', headers: {}, body }) as never;
const context = (params: Record<string, unknown>) =>
  ({ spaceId: 'sp', environmentId: 'master', appInstallationParameters: params }) as never;

describe('auditLogBroker handler', () => {
  it('returns files from storage for a valid range', async () => {
    const listLogFiles = vi.fn(async () => ({
      files: [{ key: 'k', url: 'u', size: 1, coveredDate: '2026-06-02' }],
      truncated: false,
    }));
    const handler = makeHandler(() => ({ listLogFiles }));
    const res = await handler(event({ startDate: '2026-06-01', endDate: '2026-06-10' }), context(goodParams));
    expect(res).toEqual({
      ok: true,
      files: [{ key: 'k', url: 'u', size: 1, coveredDate: '2026-06-02' }],
      truncated: false,
    });
    expect(listLogFiles).toHaveBeenCalledWith('2026-06-01', '2026-06-10');
  });

  it('rejects malformed or inverted date ranges without calling storage', async () => {
    const listLogFiles = vi.fn();
    const handler = makeHandler(() => ({ listLogFiles }));
    for (const body of [
      {},
      { startDate: 'junk', endDate: '2026-06-10' },
      { startDate: '2026-06-10', endDate: '2026-06-01' },
    ]) {
      const res = (await handler(event(body), context(goodParams))) as { ok: boolean };
      expect(res.ok).toBe(false);
    }
    expect(listLogFiles).not.toHaveBeenCalled();
  });

  it('reports missing installation parameters by name', async () => {
    const handler = makeHandler(() => ({ listLogFiles: vi.fn() }));
    const res = (await handler(
      event({ startDate: '2026-06-01', endDate: '2026-06-10' }),
      context({ bucketName: 'b' }),
    )) as { ok: boolean; error: string };
    expect(res.ok).toBe(false);
    expect(res.error).toContain('region');
  });

  it('converts storage errors into { ok:false } without a stack', async () => {
    const handler = makeHandler(() => ({
      listLogFiles: vi.fn(async () => {
        throw new Error('AccessDenied');
      }),
    }));
    const res = (await handler(
      event({ startDate: '2026-06-01', endDate: '2026-06-10' }),
      context(goodParams),
    )) as { ok: boolean; error: string };
    expect(res.ok).toBe(false);
    expect(res.error).toContain('AccessDenied');
    expect(JSON.stringify(res)).not.toContain('at ');
  });
});

describe('provider routing and validation', () => {
  const listLogFiles = vi.fn(async () => ({ files: [], truncated: false }));

  it('defaults to s3 when provider is absent and routes the s3 config', async () => {
    const factory = vi.fn(() => ({ listLogFiles }));
    const handler = makeHandler(factory);
    await handler(event({ startDate: '2026-06-01', endDate: '2026-06-10' }), context(goodParams));
    expect(factory).toHaveBeenCalledWith(expect.objectContaining({ provider: 's3', bucketName: 'b' }));
  });

  it('routes azure config when provider=azure', async () => {
    const factory = vi.fn(() => ({ listLogFiles }));
    const handler = makeHandler(factory);
    const res = await handler(
      event({ startDate: '2026-06-01', endDate: '2026-06-10' }),
      context({
        provider: 'azure',
        azureAccountName: 'acct',
        azureContainerName: 'logs',
        azureAccountKey: 'a2V5',
      }),
    );
    expect(res).toEqual({ ok: true, files: [], truncated: false });
    expect(factory).toHaveBeenCalledWith(
      expect.objectContaining({ provider: 'azure', azureAccountName: 'acct' }),
    );
  });

  it('reports azure missing params by name', async () => {
    const handler = makeHandler(() => ({ listLogFiles }));
    const res = (await handler(
      event({ startDate: '2026-06-01', endDate: '2026-06-10' }),
      context({ provider: 'azure', azureAccountName: 'acct' }),
    )) as { ok: boolean; error: string };
    expect(res.ok).toBe(false);
    expect(res.error).toContain('azureContainerName');
  });

  it('validates gcs service-account JSON shape', async () => {
    const handler = makeHandler(() => ({ listLogFiles }));
    const res = (await handler(
      event({ startDate: '2026-06-01', endDate: '2026-06-10' }),
      context({ provider: 'gcs', gcsBucketName: 'b', gcsServiceAccountKey: '{"nope":1}' }),
    )) as { ok: boolean; error: string };
    expect(res.ok).toBe(false);
    expect(res.error).toContain('client_email');
  });

  it('accepts valid gcs params', async () => {
    const factory = vi.fn(() => ({ listLogFiles }));
    const handler = makeHandler(factory);
    const key = JSON.stringify({ client_email: 'x@y.iam.gserviceaccount.com', private_key: 'PEM' });
    const res = await handler(
      event({ startDate: '2026-06-01', endDate: '2026-06-10' }),
      context({ provider: 'gcs', gcsBucketName: 'b', gcsServiceAccountKey: key }),
    );
    expect(res).toEqual({ ok: true, files: [], truncated: false });
  });

  it('rejects unknown providers cleanly', async () => {
    const handler = makeHandler(() => ({ listLogFiles }));
    const res = (await handler(
      event({ startDate: '2026-06-01', endDate: '2026-06-10' }),
      context({ provider: 'ftp' }),
    )) as { ok: boolean; error: string };
    expect(res.ok).toBe(false);
    expect(res.error).toContain('Unknown storage provider');
  });
});
