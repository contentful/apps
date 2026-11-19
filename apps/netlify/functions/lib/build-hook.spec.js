import { describe, expect, it } from 'vitest';
import {
  validateAppEvent,
  getEventDetails,
  getBuildHookIdFromSiteName,
  filterHookIdsFromCT,
} from './build-hook';

const hookId = 'my-build-hook';

describe('getBuildHookIdFromSiteName', () => {
  it('returns the hook of the given site', () => {
    const id = getBuildHookIdFromSiteName('my-site', {
      siteNames: 'my-site',
      buildHookIds: hookId,
    });

    expect(id).toEqual(hookId);
  });

  it('returns only the hook that matches the site when there are several', () => {
    const id = getBuildHookIdFromSiteName('my-site', {
      siteNames: 'my-site,another-site',
      buildHookIds: `${hookId},another-hook-id`,
    });

    expect(id).toEqual(hookId);
  });

  it('returns no hook for an unknown site', () => {
    const id = getBuildHookIdFromSiteName('unknown', {
      siteNames: 'my-site',
      buildHookIds: hookId,
    });

    expect(id).toBeNull();
  });

  it('returns no hook if siteNames is missing', () => {
    const id = getBuildHookIdFromSiteName('my-site', {
      buildHookIds: hookId,
    });

    expect(id).toBeNull()
  })

  it('returns no hook for a missing siteName', () => {
    const id = getBuildHookIdFromSiteName(null, {
      siteNames: 'my-site',
      buildHookIds: hookId,
    });

    expect(id).toBeNull()
  })
});

describe('filterHookIdsFromCT', () => {
  const postEvent = { contentTypeId: 'post', isAsset: false };

  it('returns the hook configured for the content type', () => {
    const ids = filterHookIdsFromCT(postEvent, {
      buildHookIds: hookId,
      events: { [hookId]: { cts: 'post' } },
    });

    expect(ids).toEqual([hookId]);
  });

  it('returns the hook configured with a wildcard', () => {
    const ids = filterHookIdsFromCT(postEvent, {
      buildHookIds: hookId,
      events: { [hookId]: { cts: '*' } },
    });

    expect(ids).toEqual([hookId]);
  });

  it('skips hooks that have no events configured', () => {
    const ids = filterHookIdsFromCT(postEvent, {
      buildHookIds: `${hookId},another-hook-id`,
      events: { [hookId]: { cts: '*' } },
    });

    expect(ids).toEqual([hookId]);
  });

  it('returns the hooks configured for assets when the event is an asset', () => {
    const ids = filterHookIdsFromCT(
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
    const ids = filterHookIdsFromCT(postEvent, {
      buildHookIds: hookId,
      events: { [hookId]: { cts: 'someCT' } },
    });

    expect(ids).toEqual([]);
  });

  it('returns no hook for installations without events (old params)', () => {
    const ids = filterHookIdsFromCT(postEvent, { buildHookIds: hookId });

    expect(ids).toEqual([]);
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
