interface ImportMetaEnv {
  VITE_SLACK_CLIENT_ID: string;
  VITE_BACKEND_BASE_URL: string;
}

interface ImportMetaVars extends ImportMeta {
  env: ImportMetaEnv;
}

export const CLIENT_ID = (import.meta as ImportMetaVars).env.VITE_SLACK_CLIENT_ID;
export const BACKEND_BASE_URL = (import.meta as ImportMetaVars).env.VITE_BACKEND_BASE_URL;

export const makeOAuthURL = (spaceId: string, environmentId: string) => {
  const redirectUri = encodeURIComponent(
    `${BACKEND_BASE_URL}/oauth?spaceId=${spaceId}&environmentId=${environmentId}`
  );
  return `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=chat:write,channels:read,team:read&redirect_uri=${redirectUri}`;
};
