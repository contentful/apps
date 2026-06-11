import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PageAppSDK } from '@contentful/app-sdk';
import { resolveEnvironmentId } from '../../src/hooks/useWorkflowAgent';
import { createMockSDK } from '../mocks';

describe('resolveEnvironmentId', () => {
  let sdk: PageAppSDK;

  beforeEach(() => {
    sdk = createMockSDK() as PageAppSDK;
    vi.clearAllMocks();
  });

  it('returns the alias directly when sdk.ids.environmentAlias is set', async () => {
    sdk = createMockSDK({
      ids: { space: 'test-space-id', environment: 'master-2026-06-09', environmentAlias: 'master' },
    }) as PageAppSDK;

    const result = await resolveEnvironmentId(sdk);

    expect(result).toBe('master');
    expect(sdk.cma.environment.get).not.toHaveBeenCalled();
  });

  it('resolves alias via CMA when environmentAlias is undefined and environment has aliases', async () => {
    sdk = createMockSDK({
      ids: { space: 'test-space-id', environment: 'master-2026-06-09' },
    }) as PageAppSDK;
    vi.mocked(sdk.cma.environment.get).mockResolvedValue({
      sys: { id: 'master-2026-06-09', aliases: [{ sys: { id: 'master' } }] },
    } as any);

    const result = await resolveEnvironmentId(sdk);

    expect(result).toBe('master');
    expect(sdk.cma.environment.get).toHaveBeenCalledWith({
      spaceId: 'test-space-id',
      environmentId: 'master-2026-06-09',
    });
  });

  it('returns raw environment id when no alias exists on the environment', async () => {
    sdk = createMockSDK({
      ids: { space: 'test-space-id', environment: 'my-feature-env' },
    }) as PageAppSDK;
    vi.mocked(sdk.cma.environment.get).mockResolvedValue({
      sys: { id: 'my-feature-env', aliases: [] },
    } as any);

    const result = await resolveEnvironmentId(sdk);

    expect(result).toBe('my-feature-env');
  });

  it('falls back to raw environment id when CMA call fails', async () => {
    sdk = createMockSDK({
      ids: { space: 'test-space-id', environment: 'master-2026-06-09' },
    }) as PageAppSDK;
    vi.mocked(sdk.cma.environment.get).mockRejectedValue(new Error('Network error'));

    const result = await resolveEnvironmentId(sdk);

    expect(result).toBe('master-2026-06-09');
  });
});
