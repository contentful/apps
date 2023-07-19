import {
  ChatPostMessageResponse,
  OauthV2AccessResponse,
  Block,
  KnownBlock,
  TeamInfoResponse,
  WebAPICallResult,
  WebClient,
  ConversationsListResponse,
} from '@slack/web-api';
import { SlackConfiguration } from '../config';
import { SlackError } from '../errors';
import { SpaceEnvironmentContext } from '../interfaces';

export class SlackClient {
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly backendBaseUrl: string;
  private client: WebClient;

  constructor(config: SlackConfiguration, backendBaseUrl: string) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.client = new WebClient();
    this.backendBaseUrl = backendBaseUrl;
  }

  /**
   * Retrieves an Auth Token from an OAuth exchange code
   */
  async getAuthToken(
    oauthCode: string,
    context: SpaceEnvironmentContext
  ): Promise<OauthV2AccessResponse> {
    const response = await this.client.oauth.v2.access({
      code: oauthCode,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: `${this.backendBaseUrl}/oauth?spaceId=${context.spaceId}&environmentId=${context.environmentId}`,
    });

    return SlackClient.assertSuccessResponse(response);
  }

  async refreshToken(refreshToken: string): Promise<OauthV2AccessResponse> {
    const response = await this.client.oauth.v2.access({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    return SlackClient.assertSuccessResponse(response);
  }

  async postMessage(
    token: string,
    channelId: string,
    message: {
      text?: string;
      blocks?: (Block | KnownBlock)[];
    }
  ): Promise<ChatPostMessageResponse> {
    return SlackClient.assertSuccessResponse(
      await this.client.chat.postMessage({
        token: token,
        channel: channelId,
        ...message,
      })
    );
  }

  async getWorkspaceInformation(token: string, workspaceId: string): Promise<TeamInfoResponse> {
    return SlackClient.assertSuccessResponse(
      await this.client.team.info({ team: workspaceId, token })
    );
  }

  async getChannelsList(
    token: string,
    workspaceId: string,
    cursor?: string
  ): Promise<ConversationsListResponse['channels'] | undefined> {
    const { channels, response_metadata } = await this.fetchChannels(token, workspaceId, cursor);

    if (!response_metadata?.next_cursor) {
      return channels;
    }
    return [
      ...(channels || []),
      ...((await this.getChannelsList(token, workspaceId, response_metadata?.next_cursor)) || []),
    ];
  }

  async fetchChannels(
    token: string,
    workspaceId: string,
    cursor = ''
  ): Promise<ConversationsListResponse> {
    return SlackClient.assertSuccessResponse(
      await this.client.conversations.list({
        team: workspaceId,
        token,
        cursor,
        limit: 1000,
        exclude_archived: true,
      })
    );
  }

  private static assertSuccessResponse(response: WebAPICallResult) {
    if (!response.ok) {
      throw new SlackError({ errMessage: response.error ?? 'Unknown error' });
    }

    return response;
  }
}

export const makeSlackClient = (config: SlackConfiguration, backendBaseUrl: string) =>
  new SlackClient(config, backendBaseUrl);
