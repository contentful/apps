export const WORKFLOW_AGENT_ID = 'google-docs-workflow-agent';

export const POLL_INTERVAL_MS = 10000; // 10 seconds

const MAX_POLL_TIME_MS = 5 * 60 * 1000 * 10; // 50 minutes

export const MAX_POLL_ATTEMPTS = Math.floor(MAX_POLL_TIME_MS / POLL_INTERVAL_MS);

export const LOCAL_AGENTS_API_BASE_URL = 'http://localhost:4111';

export const USE_LOCAL_AGENTS_API = true;

export const CONTENT_TYPE_SUBMIT_LOADING_DELAY_MS = 30000; // 30 seconds to wait for suspend payload

// Agents-api writes PENDING_REVIEW status before the suspendPayload metadata flushes.
// Allow this many consecutive PENDING_REVIEW polls with no suspendPayload before giving up.
export const MAX_PENDING_REVIEW_MISSING_PAYLOAD_RETRIES = 5; // 5 × 10s = 50s max wait
