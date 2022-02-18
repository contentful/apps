'use strict';

const {
  getBuildHooksFromAppInstallationParams,
  extractAppContextDetails,
} = require('./build-hook');

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
  describe('for AppActionCall', () => {
    test('it succeed with correct installation parameters', async () => {
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

      const hookId = await getBuildHooksFromAppInstallationParams(
        extractAppContextDetails(actionCall),
        getMgmtToken,
        mockFetch({
          buildHookIds: expectedHookId,
        })
      );
      expect(hookId).toEqual([expectedHookId]);
    });

    test('it succeed with list of build hook ids in installation parameters', async () => {
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

      const hookId = await getBuildHooksFromAppInstallationParams(
        extractAppContextDetails(actionCall),
        getMgmtToken,
        mockFetch({
          buildHookIds: `${expectedHookId},another-hook-id`,
        })
      );
      expect(hookId).toEqual([expectedHookId]);
    });

    test('it should throw error if invalid AppActionCall is used', async () => {
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
        getBuildHooksFromAppInstallationParams(
          extractAppContextDetails(actionCall),
          getMgmtToken,
          mockFetch({ buildHookIds: expectedHookId })
        )
      ).rejects.toThrow('Invalid request, requires action call or publish/unpublish event');
    });

    test('it should throw error if App Installation is missing parameters', async () => {
      const actionCall = {
        sys: {
          appDefinition: { sys: { id: 'some-app-def' } },
          environment: { sys: { id: 'master' } },
          space: { sys: { id: 'some-space' } },
        },
        body: {
          buildHookId: 'my-build-hook',
        },
      };

      await expect(
        getBuildHooksFromAppInstallationParams(
          extractAppContextDetails(actionCall),
          getMgmtToken,
          mockFetch({})
        )
      ).rejects.toThrow('Missing build hook parameters in app installation');
    });
  });

  describe('for AppEvents', () => {
    test('it succeed with correct installation parameters', async () => {
      const expectedHookId = 'my-build-hook';
      const unpublishEvent = {
        sys: {
          type: 'DeletedEntry',
          id: 'my–entry-id',
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'some-space-id' },
          },
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'post' },
          },
          revision: 11,
          createdAt: '2022-02-18T11:37:11.986Z',
          updatedAt: '2022-02-18T11:37:11.986Z',
          deletedAt: '2022-02-18T11:37:11.986Z',
        },
      };

      const hookId = await getBuildHooksFromAppInstallationParams(
        extractAppContextDetails(unpublishEvent),
        getMgmtToken,
        mockFetch({
          buildHookIds: expectedHookId,
          events: { [expectedHookId]: ['post'] },
        })
      );
      expect(hookId).toEqual([expectedHookId]);
    });

    test('it succeed with correct installation parameters with wildcard', async () => {
      const expectedHookId = 'my-build-hook';
      const publishEvent = {
        metadata: { tags: [] },
        sys: {
          type: 'Entry',
          id: 'some-entry-id',
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'my-space-id' },
          },
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'post' },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: 'user-id',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: 'user-id',
            },
          },
          revision: 12,
          createdAt: '2022-02-15T14:50:53.979Z',
          updatedAt: '2022-02-18T11:37:14.616Z',
        },
        fields: {
          title: { 'en-US': 'Test title' },
          postText: { 'en-US': 'Testing text' },
        },
      };

      const hookId = await getBuildHooksFromAppInstallationParams(
        extractAppContextDetails(publishEvent),
        getMgmtToken,
        mockFetch({
          buildHookIds: expectedHookId,
          events: { [expectedHookId]: '*' },
        })
      );
      expect(hookId).toEqual([expectedHookId]);
    });

    test('it succeed with list of build hook ids in installation parameters', async () => {
      const expectedHookId = 'my-build-hook';
      const publishEvent = {
        metadata: { tags: [] },
        sys: {
          type: 'Entry',
          id: 'some-entry-id',
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'my-space-id' },
          },
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'post' },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: 'user-id',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: 'user-id',
            },
          },
          revision: 12,
          createdAt: '2022-02-15T14:50:53.979Z',
          updatedAt: '2022-02-18T11:37:14.616Z',
        },
        fields: {
          title: { 'en-US': 'Test title' },
          postText: { 'en-US': 'Testing text' },
        },
      };

      const hookId = await getBuildHooksFromAppInstallationParams(
        extractAppContextDetails(publishEvent),
        getMgmtToken,
        mockFetch({
          buildHookIds: `${expectedHookId},another-hook-id`,
          events: { [expectedHookId]: '*' },
        })
      );
      expect(hookId).toEqual([expectedHookId]);
    });

    test('it should return no hook if no app event for the content type', async () => {
      const expectedHookId = 'my-build-hook';
      const publishEvent = {
        metadata: { tags: [] },
        sys: {
          type: 'Entry',
          id: 'some-entry-id',
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'my-space-id' },
          },
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'post' },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: 'user-id',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: 'user-id',
            },
          },
          revision: 12,
          createdAt: '2022-02-15T14:50:53.979Z',
          updatedAt: '2022-02-18T11:37:14.616Z',
        },
        fields: {
          title: { 'en-US': 'Test title' },
          postText: { 'en-US': 'Testing text' },
        },
      };

      expect(
        await getBuildHooksFromAppInstallationParams(
          extractAppContextDetails(publishEvent),
          getMgmtToken,
          mockFetch({
            buildHookIds: expectedHookId,
            events: { [expectedHookId]: ['someCT'] },
          })
        )
      ).toEqual([]);
    });

    test('it should throw error if App Installation is missing parameters', async () => {
      const publishEvent = {
        metadata: { tags: [] },
        sys: {
          type: 'Entry',
          id: 'some-entry-id',
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'my-space-id' },
          },
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
          },
          contentType: {
            sys: { type: 'Link', linkType: 'ContentType', id: 'post' },
          },
          createdBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: 'user-id',
            },
          },
          updatedBy: {
            sys: {
              type: 'Link',
              linkType: 'User',
              id: 'user-id',
            },
          },
          revision: 12,
          createdAt: '2022-02-15T14:50:53.979Z',
          updatedAt: '2022-02-18T11:37:14.616Z',
        },
        fields: {
          title: { 'en-US': 'Test title' },
          postText: { 'en-US': 'Testing text' },
        },
      };

      await expect(
        getBuildHooksFromAppInstallationParams(
          extractAppContextDetails(publishEvent),
          getMgmtToken,
          mockFetch({})
        )
      ).rejects.toThrow('Missing build hook parameters in app installation');
    });
  });
});
