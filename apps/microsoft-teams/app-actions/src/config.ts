interface Config {
  botServiceUrl: string | undefined;
  apiKey: string | undefined;
}

export const config: Config = {
  botServiceUrl: process.env.MSTEAMS_BOT_SERVICE_BASE_URL,
  apiKey: process.env.MSTEAMS_CLIENT_API_KEY,
};
