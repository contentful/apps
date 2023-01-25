import { SlackClient } from '../../clients';
import { Block, ChatPostMessageResponse, KnownBlock } from '@slack/web-api';

export class MessagesRepository {
  constructor(private slackClient: SlackClient) {}

  async create(
    token: string,
    channelId: string,
    message: {
      text?: string;
      blocks?: (Block | KnownBlock)[];
    }
  ): Promise<ChatPostMessageResponse> {
    return this.slackClient.postMessage(token, channelId, message);
  }
}
