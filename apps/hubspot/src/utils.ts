export const HUBSPOT_PRIVATE_APPS_URL = 'https://developers.hubspot.com/docs/api/private-apps';

export const CONFIG_SCREEN_INSTRUCTIONS = [
  'Navigate to your Hubspot account settings',
  "In the left hand navigation, click 'Integrations' and select 'Private apps' from the sub menu",
  'Create a new private app',
  "Within your private app, navigate to the 'Auth' tab. There, you can view and copy your private app access token.",
  'Paste your private app access token in the field above',
];

export type AppInstallationParameters = {
  hubspotAccessToken: string;
};
