import { CanonicalRequest, CMAClient, ConfigAppSDK } from '@contentful/app-sdk';
import { BACKEND_BASE_URL } from './constants';
import { ConnectedWorkspace, SlackChannel, SlackChannelSimplified } from './workspace.store';
import { getEnvironmentName } from './utils';

const makeSignedRequest = async (
  canonicalRequest: CanonicalRequest,
  { appDefinitionId, cma }: { appDefinitionId: string; cma: CMAClient }
) => {
  // When run locally, backend base url has a prefix. This makes sure we're signing the right thing
  const signedPath = new URL(`${BACKEND_BASE_URL}${canonicalRequest.path}`).pathname;

  // TODO: handle failed verification
  const { additionalHeaders } = await cma.appSignedRequest.create(
    {
      appDefinitionId,
    },
    // @ts-expect-error There is a mismatch in types between app-sdk and cmajs :(
    { ...canonicalRequest, path: signedPath }
  );
  canonicalRequest.headers ??= {};
  Object.assign(canonicalRequest.headers, additionalHeaders);

  return fetch(`${BACKEND_BASE_URL}${canonicalRequest.path}`, canonicalRequest).then((res) =>
    res.json()
  );
};

export const apiClient = {
  getWorkspace: async (
    sdk: ConfigAppSDK,
    workspaceId: string,
    cma: CMAClient
  ): Promise<ConnectedWorkspace> => {
    const req = {
      method: 'GET' as const,
      path: `/spaces/${sdk.ids.space}/environments/${getEnvironmentName(
        sdk.ids
      )}/workspaces/${workspaceId}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const response = await makeSignedRequest(req, { appDefinitionId: sdk.ids.app, cma });

    if (response.status > 200) {
      throw new Error('Something went wrong fetching the connected workspace. Please try again.');
    }
    return response;
  },
  getChannels: async (
    sdk: ConfigAppSDK,
    workspaceId: string,
    cma: CMAClient
  ): Promise<SlackChannel[] | undefined> => {
    const req = {
      method: 'GET' as const,
      path: `/spaces/${sdk.ids.space}/environments/${getEnvironmentName(
        sdk.ids
      )}/workspaces/${workspaceId}/channels`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await makeSignedRequest(req, { appDefinitionId: sdk.ids.app, cma });
    if (response.status > 200) {
      throw new Error('Unable to fetch channels');
    }
    return response;
  },

  getChannel: async (
    sdk: ConfigAppSDK,
    workspaceId: string,
    cma: CMAClient,
    channelId: string
  ): Promise<SlackChannel | undefined> => {
    const req = {
      method: 'GET' as const,
      path: `/spaces/${sdk.ids.space}/environments/${getEnvironmentName(
        sdk.ids
      )}/workspaces/${workspaceId}/channel/${channelId}`,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const response = await makeSignedRequest(req, { appDefinitionId: sdk.ids.app, cma });
    if (response.status > 200) {
      throw new Error('Unable to fetch channel');
    }
    return response;
  },

  createAuthToken: async (
    sdk: ConfigAppSDK,
    cma: CMAClient,
    temporaryRefreshToken: string,
    installationUuid: string
  ) => {
    return makeSignedRequest(
      {
        method: 'POST',
        path: `/tokens`,
        headers: {
          'Content-Type': 'application/json',
          'X-Contentful-UUID': `${installationUuid}`,
        },
        body: JSON.stringify({
          refreshToken: temporaryRefreshToken,
        }),
      },
      { appDefinitionId: sdk.ids.app, cma }
    );
  },
};

export const slackClient = {
  getWorkspace: async (token: string) => {
    // Only works with POSt + x-www-form-urlencoded because slack throws CORS otherwise
    const response = await fetch('https://slack.com/api/team.info', {
      method: 'POST',
      body: `token=${token}`,
      headers: { ['Content-type']: 'application/x-www-form-urlencoded' },
    }).then((res) => res.json());
    return response.team;
  },

  getChannels: async (
    token: string,
    workspaceId: string,
    cursor?: string | undefined
  ): Promise<SlackChannelSimplified[]> => {
    // Only works with POSt + x-www-form-urlencoded because slack throws CORS otherwise
    const channels = await fetchChannels(token, workspaceId, cursor);
    return channels.map((channel: SlackChannel) => {
      return { id: channel.id, name: channel.name };
    });
  },
};

const fetchChannels = async (
  token: string,
  workspaceId: string,
  cursor: string | undefined = ''
): Promise<SlackChannel[]> => {
  const { channels, response_metadata } = await fetch('https://slack.com/api/users.conversations', {
    method: 'POST',
    body: `token=${token}&team_id=${workspaceId}&cursor=${cursor}&limit=1000`,
    headers: { ['Content-type']: 'application/x-www-form-urlencoded' },
  }).then((res) => res.json());

  if (!response_metadata?.next_cursor) {
    return channels;
  }

  return [
    ...(channels || []),
    ...(await fetchChannels(token, workspaceId, response_metadata?.next_cursor)),
  ];
};
