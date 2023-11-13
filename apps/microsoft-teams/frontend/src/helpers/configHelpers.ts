import { ContentTypeProps } from 'contentful-management';
import { TeamsChannel } from '@customTypes/configPage';

const getContentTypeName = (
  contentTypeId: string,
  contentTypes: ContentTypeProps[],
  notFoundCopy: string
): string => {
  const contentType = contentTypes.find((contentType) => contentType.sys.id === contentTypeId);
  return contentType ? contentType.name : notFoundCopy;
};

// TODO: update this when we start fetching channel installations
const getChannelName = (channelId: string, channels: TeamsChannel[], notFoundCopy: string) => {
  const channel = channels.find((channel) => channelId === channel.id);
  const displayName = channel ? `${channel.name}, ${channel.teamName}` : notFoundCopy;
  return displayName;
};

export { getContentTypeName, getChannelName };
