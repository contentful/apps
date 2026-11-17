import { describe, expect, it } from 'vitest';
import {
  validateAppEvent,
  getEventDetails,
  validateParams,
  getBuildHookIdFromSiteName,
  filterHookIdsFromCT,
} from './build-hook';

const hookId = 'my-build-hook';

const getBuildHookIds = ({ siteName, contentTypeId, isAsset }, parameters) => {
  if (!siteName && !contentTypeId && !isAsset) {
    throw new Error('Invalid request, requires action call or publish/unpublish event');
  }

  validateParams(parameters);

  return siteName
    ? getBuildHookIdFromSiteName(siteName, parameters)
    : filterHookIdsFromCT({ contentTypeId, isAsset }, parameters);
};

describe('getBuildHookIds', () => {
  describe('for an app action', () => {
    it('returns the hook of the given site', () => {
      const ids = getBuildHookIds(
        { siteName: 'my-site' },
        { siteNames: 'my-site', buildHookIds: hookId }
      );

      expect(ids).toEqual([hookId]);
    });

    it('returns only the hook that matches the site when there are several', () => {
      const ids = getBuildHookIds(
        { siteName: 'my-site' },
        { siteNames: 'my-site,another-site', buildHookIds: `${hookId},another-hook-id` }
      );

      expect(ids).toEqual([hookId]);
    });

    it('returns no hook for an unknown site', () => {
      const ids = getBuildHookIds(
        { siteName: 'unknown' },
        { siteNames: 'my-site', buildHookIds: hookId }
      );

      expect(ids).toEqual([]);
    });

    it('throws if there is neither a site nor an event', () => {
      expect(() =>
        getBuildHookIds({ siteName: '' }, { siteNames: 'my-site', buildHookIds: hookId })
      ).toThrow('Invalid request, requires action call or publish/unpublish event');
    });

    it('throws if the installation is missing the build hook parameters', () => {
      expect(() => getBuildHookIds({ siteName: 'my-site' }, {})).toThrow(
        'Missing build hook parameters in app installation'
      );
    });
  });

  describe('for an app event', () => {
    it('returns the hook configured for the content type', () => {
      const ids = getBuildHookIds(
        { contentTypeId: 'post', isAsset: false },
        { buildHookIds: hookId, events: { [hookId]: { cts: 'post' } } }
      );

      expect(ids).toEqual([hookId]);
    });

    it('returns the hook configured with a wildcard', () => {
      const ids = getBuildHookIds(
        { contentTypeId: 'post', isAsset: false },
        { buildHookIds: hookId, events: { [hookId]: { cts: '*' } } }
      );

      expect(ids).toEqual([hookId]);
    });

    it('skips hooks that have no events configured', () => {
      const ids = getBuildHookIds(
        { contentTypeId: 'post', isAsset: false },
        {
          buildHookIds: `${hookId},another-hook-id`,
          events: { [hookId]: { cts: '*' } },
        }
      );

      expect(ids).toEqual([hookId]);
    });

    it('returns the hooks configured for assets when the event is an asset', () => {
      const ids = getBuildHookIds(
        { contentTypeId: '', isAsset: true },
        {
          buildHookIds: `${hookId},another-hook-id`,
          events: {
            [hookId]: { cts: '*', assets: true },
            'another-hook-id': { cts: '*' },
          },
        }
      );

      expect(ids).toEqual([hookId]);
    });

    it('returns no hook if no event matches the content type', () => {
      const ids = getBuildHookIds(
        { contentTypeId: 'post', isAsset: false },
        { buildHookIds: hookId, events: { [hookId]: { cts: 'someCT' } } }
      );

      expect(ids).toEqual([]);
    });

    it('returns no hook for installations without events (old params)', () => {
      const ids = getBuildHookIds(
        { contentTypeId: 'post', isAsset: false },
        { buildHookIds: hookId }
      );

      expect(ids).toEqual([]);
    });

    it('throws if the installation is missing the build hook parameters', () => {
      expect(() => getBuildHookIds({ contentTypeId: 'post', isAsset: false }, {})).toThrow(
        'Missing build hook parameters in app installation'
      );
    });
  });
});

describe('validateAppEvent', () => {
  it.each(['Entry', 'DeletedEntry', 'Asset', 'DeletedAsset'])('accepts %s', (type) => {
    expect(() => validateAppEvent({ sys: { type } })).not.toThrow();
  });

  it('rejects other entity types', () => {
    expect(() => validateAppEvent({ sys: { type: 'ContentType' } })).toThrow(
      'Unsupported entity type'
    );
  });

  it('rejects an empty body', () => {
    expect(() => validateAppEvent(undefined)).toThrow('Unsupported entity type');
  });
});

describe('getEventDetails', () => {
  it('reads the content type of an entry', () => {
    expect(
      getEventDetails({ sys: { type: 'Entry', contentType: { sys: { id: 'post' } } } })
    ).toEqual({ contentTypeId: 'post', isAsset: false });
  });

  it('flags assets', () => {
    expect(getEventDetails({ sys: { type: 'DeletedAsset' } })).toEqual({
      contentTypeId: '',
      isAsset: true,
    });
  });
});
