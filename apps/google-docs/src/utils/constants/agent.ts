export const AGENT_ID = 'google-docs-agent';

export const POLL_INTERVAL_MS = 10000; // 10 seconds

export const MAX_POLL_TIME_MS = 5 * 60 * 1000; // 5 minutes

export const MAX_POLL_ATTEMPTS = Math.floor(MAX_POLL_TIME_MS / POLL_INTERVAL_MS);

export const isLocalDevAgent = (): boolean => {
  return true;
};
