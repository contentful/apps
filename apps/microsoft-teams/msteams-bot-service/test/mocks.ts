import sinon from 'sinon';
import { BotBuilderCloudAdapter } from '@microsoft/teamsfx';
import ConversationBot = BotBuilderCloudAdapter.ConversationBot;
import { Request, Response } from 'botbuilder';
import { Response as ExpressResponse } from 'express';

export const makeMockConversationBot = (): sinon.SinonStubbedInstance<ConversationBot> => {
  const stubbedBot = sinon.stub(
    new ConversationBot({
      adapterConfig: {
        MicrosoftAppId: 'microsoft-app-id',
        MicrosoftAppPassword: 'microsfot-app-password',
        MicrosoftAppType: 'MultiTenant',
      },
      notification: {
        enabled: true,
      },
    })
  );
  stubbedBot.requestHandler.callsFake(async (_request: Request, response: Response) => {
    // the bot request handler is responsible for sending along a result, we will
    // just mock that behavior here to ensure our mock actually finishes the response
    (response as ExpressResponse).status(200).send();
  });
  return stubbedBot;
};
