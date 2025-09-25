import { config } from '../config';
import { ApiError } from '../errors';
import { AppActionRequestContext, TeamInstallation } from '../types';
import { Channel } from '../../../types';

const GENERAL_CHANNEL_NAME = 'general';

export const getChannelsList = async (
  tenantId: string,
  requestContext: AppActionRequestContext
): Promise<Channel[]> => {
  const response = await config.msTeamsBotService.getTeamInstallations(tenantId, requestContext);

  if (!response.ok) {
    throw new ApiError(response.error);
  }

  const channelsList = transformInstallationsToChannelsList(response.data, tenantId);
  const sortedChannelsList = channelsList.sort(sortChannels);
  return sortedChannelsList;
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

/**
 * Sorts the channels alpha by team name, then General channel, then alpha by channel name
 */
export const sortChannels = (a: Channel, b: Channel) => {
  const teamA = a.teamName.toLowerCase();
  const teamB = b.teamName.toLowerCase();
  const channelA = a.name.toLowerCase();
  const channelB = b.name.toLowerCase();

  if (teamA === teamB) {
    if (channelA === GENERAL_CHANNEL_NAME) {
      return -1;
    } else if (channelB === GENERAL_CHANNEL_NAME) {
      return 1;
    } else {
      return channelA.localeCompare(channelB);
    }
  } else {
    return teamA.localeCompare(teamB);
  }
};
