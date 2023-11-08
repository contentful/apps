import { BotBuilderCloudAdapter } from '@microsoft/teamsfx';
import ConversationBot = BotBuilderCloudAdapter.ConversationBot;
import { Request, Response } from 'express';
import { TurnContext } from 'botbuilder';

export class MsTeamsConversationService {
  constructor(private readonly msTeamsConversationBot: ConversationBot) {}

  static fromBotCredentials(botId: string, botPassword: string): MsTeamsConversationService {
    const conversationBot = new ConversationBot({
      adapterConfig: {
        MicrosoftAppId: botId,
        MicrosoftAppPassword: botPassword,
        MicrosoftAppType: 'MultiTenant',
      },
      notification: {
        enabled: true,
      },
    });
    return new MsTeamsConversationService(conversationBot);
  }

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  async handleRequest(
    request: Request,
    response: Response,
    logic?: (context: TurnContext) => Promise<any>
  ): Promise<void> {
    try {
      return await this.msTeamsConversationBot.requestHandler(request, response, logic);
    } catch (e) {
      console.log('error', JSON.stringify(e));
      throw e;
    }
  }
}
