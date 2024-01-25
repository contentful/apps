import { config } from '../config';
import { AppActionCallResponse, Channel, TeamInstallation } from '../types';

export const getChannelsList = async (tenantId: string): Promise<Channel[]> => {
  const response = await config.msTeamsBotService.getTeamInstallations(tenantId);

  if (!response.ok) {
    throw new Error(response.error ?? 'Failed to get channels');
  }

  const channelsList = transformInstallationsToChannelsList(response.data, tenantId);
  return channelsList;
};

export const transformInstallationsToChannelsList = (
  data: TeamInstallation[],
  tenantId: string
) => {
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
