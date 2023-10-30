import { BotBuilderCloudAdapter } from '@microsoft/teamsfx';
import ConversationBot = BotBuilderCloudAdapter.ConversationBot;
import config from './config';

// Create bot.
export const notificationApp = new ConversationBot({
  // The bot id and password to create CloudAdapter.
  // See https://aka.ms/about-bot-adapter to learn more about adapters.
  adapterConfig: {
    MicrosoftAppId: config.botId,
    MicrosoftAppPassword: config.botPassword,
    MicrosoftAppType: 'MultiTenant',
    // MicrosoftAppType: "SingleTenant", // original code had this as "MultiTenant" with no tenant id
    // MicrosoftAppTenantId: "" // add tenant if you are using "SingleTenant"
  },
  // Enable notification
  notification: {
    enabled: true,
  },
});
