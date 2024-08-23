import { getAppIds } from './getAppIds';

describe('getAppIds.tsx', () => {
  it('matches env', () => {
    const appIds = getAppIds();
    expect(appIds).toEqual({
      sapAppId: ['TEST_SAP_APP_ID'],
      sapAirAppId: ['TEST_SAP_AIR_APP_ID'],
    });
  });
});
