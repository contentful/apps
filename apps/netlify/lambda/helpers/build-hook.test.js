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
    const siteName = 'my-site-name';

    test('it succeed with correct installation parameters', async () => {
      const expectedHookId = 'my-build-hook';
      const actionCallCtx = {
        headers: {
          'x-contentful-environment-id': 'master',
          'x-contentful-space-id': 'some-space',
        },
        body: {
          siteName,
        },
      };

      const hookId = await getBuildHooksFromAppInstallationParams(
        extractAppContextDetails(actionCallCtx),
        getMgmtToken,
        mockFetch({
          siteNames: siteName,
          buildHookIds: expectedHookId,
        })
      );
      expect(hookId).toEqual([expectedHookId]);
    });

    test('it succeed with list of build hook ids in installation parameters', async () => {
      const expectedHookId = 'my-build-hook';
      const actionCall = {
        headers: {
          'x-contentful-environment-id': 'master',
          'x-contentful-space-id': 'some-space',
        },
        body: {
          siteName,
        },
      };

      const hookId = await getBuildHooksFromAppInstallationParams(
        extractAppContextDetails(actionCall),
        getMgmtToken,
        mockFetch({
          siteNames: `${siteName},another-site-name`,
          buildHookIds: `${expectedHookId},another-hook-id`,
        })
      );
      expect(hookId).toEqual([expectedHookId]);
    });

    test('it should throw error if invalid AppActionCall is used', async () => {
      const expectedHookId = 'my-build-hook';
      const actionCall = {
        headers: {
          'x-contentful-environment-id': 'master',
          'x-contentful-space-id': 'some-space',
        },
        body: {
          value: 'foo',
        },
      };

      await expect(
        getBuildHooksFromAppInstallationParams(
          extractAppContextDetails(actionCall),
          getMgmtToken,
          mockFetch({
            siteName,
            buildHookIds: expectedHookId,
          })
        )
      ).rejects.toThrow('Invalid request, requires action call or publish/unpublish event');
    });

    test('it should throw error if App Installation is missing parameters', async () => {
      const actionCall = {
        headers: {
          'x-contentful-environment-id': 'master',
          'x-contentful-space-id': 'some-space',
        },
        body: {
          siteName,
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
        extractAppContextDetails({ body: unpublishEvent }),
        getMgmtToken,
        mockFetch({
          buildHookIds: expectedHookId,
          events: { [expectedHookId]: { cts: 'post' } },
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
        extractAppContextDetails({ body: publishEvent }),
        getMgmtToken,
        mockFetch({
          buildHookIds: expectedHookId,
          events: { [expectedHookId]: { cts: '*' } },
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
        extractAppContextDetails({ body: publishEvent }),
        getMgmtToken,
        mockFetch({
          buildHookIds: `${expectedHookId},another-hook-id`,
          events: { [expectedHookId]: { cts: '*' } },
        })
      );
      expect(hookId).toEqual([expectedHookId]);
    });

    test('it succeed for assets if the published event is for an asset', async () => {
      const expectedHookId = 'my-build-hook';
      const publishEvent = {
        metadata: { tags: [] },
        sys: {
          type: 'Asset',
          id: 'some-entry-id',
          space: {
            sys: { type: 'Link', linkType: 'Space', id: 'my-space-id' },
          },
          environment: {
            sys: { id: 'master', type: 'Link', linkType: 'Environment' },
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
          title: {
            'en-US': 'Doge',
          },
          description: {
            'en-US': 'Wow! Such depth! Much 3D!',
          },
          file: {
            'en-US': {
              url: '//images.contentful.com/mySpaceId/1SdUi3xBMTRm2LxnQ9LEtk/doidsam32898sdaf/doge.jpg',
              details: {
                size: 423999,
                image: {
                  width: 1500,
                  height: 1500,
                },
              },
              fileName: 'doge.jpg',
              contentType: 'image/jpeg',
            },
          },
        },
      };

      const hookId = await getBuildHooksFromAppInstallationParams(
        extractAppContextDetails({ body: publishEvent }),
        getMgmtToken,
        mockFetch({
          buildHookIds: `${expectedHookId},another-hook-id`,
          events: {
            [expectedHookId]: {
              cts: '*',
              assets: true,
            },
          },
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
          extractAppContextDetails({ body: publishEvent }),
          getMgmtToken,
          mockFetch({
            buildHookIds: expectedHookId,
            events: { [expectedHookId]: { cts: 'someCT' } },
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
          extractAppContextDetails({ body: publishEvent }),
          getMgmtToken,
          mockFetch({})
        )
      ).rejects.toThrow('Missing build hook parameters in app installation');
    });
  });
});
