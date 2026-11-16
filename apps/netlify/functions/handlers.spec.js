import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler as appEventHandler } from './appEventHandler';

const hookId = 'my-build-hook';
const netlifyUrl = (id) => `https://api.netlify.com/build_hooks/${id}`;

describe('functions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, status: 200 }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('appEventHandler', () => {
    const context = {
      appInstallationParameters: {
        buildHookIds: `${hookId},other-hook`,
        events: { [hookId]: { cts: 'post' }, 'other-hook': { cts: 'page' } },
      },
    };
    const entryEvent = (contentTypeId) => ({
      body: { sys: { type: 'Entry', contentType: { sys: { id: contentTypeId } } } },
    });

    it('fires only the hooks configured for the content type', async () => {
      await appEventHandler(entryEvent('post'), context);

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(netlifyUrl(hookId), { method: 'POST' });
    });

    it('fails when no hook is configured for the content type', async () => {
      await expect(appEventHandler(entryEvent('unknown'), context)).rejects.toThrow(
        'Missing build hook'
      );
      expect(fetch).not.toHaveBeenCalled();
    });

    it('fails for unsupported entity types', async () => {
      await expect(
        appEventHandler({ body: { sys: { type: 'ContentType' } } }, context)
      ).rejects.toThrow('Unsupported entity type');
    });
  });
});
