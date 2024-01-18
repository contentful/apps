import { AppActionCallResponse, Channel, TeamInstallation } from '../types';

export const getChannelsList = async (
  botServiceUrl: string,
  apiKey: string,
  tenantId: string
): Promise<Channel[]> => {
  const res = await fetch(`${botServiceUrl}/api/tenants/${tenantId}/team_installations`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
  });

  // TODO: Parse the response instead of the assertion here
  const response = (await res.json()) as AppActionCallResponse<TeamInstallation[]>;

  if (!response.ok) {
    throw new Error(response.errors?.[0]?.message ?? 'Failed to get channels');
  }

  const channelsList = transformInstallationsToChannelsList(response.data, tenantId);
  return channelsList;
};

const transformInstallationsToChannelsList = (data: TeamInstallation[], tenantId: string) => {
  const teamIds: Set<string> = new Set();
  const channelsList = data.reduce((channels, installation) => {
    const {
      channelInfos,
      teamDetails: { id: teamId, name: teamName },
    } = installation;

    if (teamIds.has(teamId)) return channels;

    teamIds.add(teamId);
    const newChannelsList: Channel[] = channelInfos.map((channel) => {
      return {
        ...channel,
        tenantId,
        teamId,
        teamName,
      };
    });

    return channels.concat(newChannelsList);
  }, [] as Channel[]);

  return channelsList;
};
