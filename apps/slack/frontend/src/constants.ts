export const CLIENT_ID = process.env.REACT_APP_SLACK_CLIENT_ID;
export const BACKEND_BASE_URL = process.env.REACT_APP_BACKEND_BASE_URL;

export const makeOAuthURL = (spaceId: string, environmentId: string) => {
  const redirectUri = encodeURIComponent(
    `${BACKEND_BASE_URL}/oauth?spaceId=${spaceId}&environmentId=${environmentId}`
  );
  return `https://slack.com/oauth/v2/authorize?client_id=${CLIENT_ID}&scope=chat:write,channels:read,team:read&redirect_uri=${redirectUri}`;
};
