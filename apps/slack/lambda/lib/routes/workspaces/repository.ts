import { SlackClient } from '../../clients';
import { NotFoundException } from '../../errors';
import { TeamInfoResponse } from '@slack/web-api';
import { notFoundMessage } from './constants';

export class WorkspacesRepository {
  constructor(private slackClient: SlackClient) {}

  async get(token: string, workspaceId: string) {
    const info = await this.slackClient.getWorkspaceInformation(token, workspaceId);

    if (!info?.team) {
      throw new NotFoundException({ errMessage: notFoundMessage(workspaceId) });
    }

    return WorkspacesRepository.toAPI(info.team);
  }

  async getChannels(token: string, workspaceId: string) {
    const channelsList = await this.slackClient.getChannelsList(token, workspaceId);
    return channelsList?.map(({ id, name }) => {
      return { id, name };
    });
  }

  async getChannel(token: string, channelId: string) {
    const response = await this.slackClient.getChannel(token, channelId);
    return response?.channel;
  }

  private static toAPI({ id, name, icon }: NonNullable<TeamInfoResponse['team']>) {
    return { id, name, icon };
  }
}
