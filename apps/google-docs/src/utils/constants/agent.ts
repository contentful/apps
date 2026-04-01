export const WORKFLOW_AGENT_ID = 'google-docs-workflow-agent';

export const POLL_INTERVAL_MS = 10000; // 10 seconds

const MAX_POLL_TIME_MS = 5 * 60 * 1000 * 10; // 50 minutes

export const MAX_POLL_ATTEMPTS = Math.floor(MAX_POLL_TIME_MS / POLL_INTERVAL_MS);

export const LOCAL_AGENTS_API_BASE_URL = 'http://localhost:4111';

export const CONTENT_TYPE_SUBMIT_LOADING_DELAY_MS = 15000; // 15 seconds to wait for suspend payload
