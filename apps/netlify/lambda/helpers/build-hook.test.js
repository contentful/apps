'use strict';

const getBuildHookFromAppInstallationParams = require('./validate-build-hook');

const getMgmtToken = () => 'some-random-token';
const mockFetch = (parameters) => async () => {
  return await Promise.resolve({
    async json() {
      return {
        sys: {
          type: 'AppInstallation',
          appDefinition: {
            sys: {
              type: 'Link',
              linkType: 'AppDefinition',
              id: 'some-app-def',
            },
          },
          space: {
            sys: {
              type: 'Link',
              linkType: 'Space',
              id: 'some-space',
            },
          },
          environment: {
            sys: {
              type: 'Link',
              linkType: 'Environment',
              id: 'master',
            },
          },
        },
        parameters,
      };
    },
  });
};

describe('Validate Build hook', () => {
  test('succeed with correct installation parameters', async () => {
    const expectedHookId = 'my-build-hook';
    const actionCall = {
      sys: {
        appDefinition: { sys: { id: 'some-app-def' } },
        environment: { sys: { id: 'master' } },
        space: { sys: { id: 'some-space' } },
      },
      body: {
        buildHookId: expectedHookId,
      },
    };

    const hookId = await getBuildHookFromAppInstallationParams(
      actionCall,
      getMgmtToken,
      mockFetch({ buildHookIds: expectedHookId })
    );
    expect(hookId).toEqual(expectedHookId);
  });

  test('should throw error if wrong AppActionCall is returned', async () => {
    const expectedHookId = 'my-build-hook';
    const actionCall = {
      sys: {
        appDefinition: { sys: { id: 'some-app-def' } },
        environment: { sys: { id: 'master' } },
        space: { sys: { id: 'some-space' } },
      },
      body: {
        value: 'foo',
      },
    };

    await expect(
      getBuildHookFromAppInstallationParams(
        actionCall,
        getMgmtToken,
        mockFetch({ buildHookIds: expectedHookId })
      )
    ).rejects.toThrow('Invalid build hook');
  });

  test('should throw error if wrong AppActionCall is returned', async () => {
    const actionCall = {
      sys: {
        appDefinition: { sys: { id: 'some-app-def' } },
        environment: { sys: { id: 'master' } },
        space: { sys: { id: 'some-space' } },
      },
      body: {
        value: 'foo',
      },
    };

    await expect(
      getBuildHookFromAppInstallationParams(actionCall, getMgmtToken, mockFetch({}))
    ).rejects.toThrow('Missing build hook parameters in app installation');
  });

  test('should throw error if wrong AppActionCall is returned', async () => {
    const actionCall = {
      sys: {
        appDefinition: { sys: { id: 'some-app-def' } },
        environment: { sys: { id: 'master' } },
        space: { sys: { id: 'some-space' } },
      },
      body: {
        value: 'foo',
      },
    };

    await expect(
      getBuildHookFromAppInstallationParams(actionCall, getMgmtToken, mockFetch({}))
    ).rejects.toThrow('Missing build hook parameters in app installation');
  });
});
