export const WORKFLOW_AGENT_ID = 'google-docs-workflow-agent';

export const POLL_INTERVAL_MS = 10000; // 10 seconds

const MAX_POLL_TIME_MS = 20 * 60 * 1000; // 20 minutes

export const MAX_POLL_ATTEMPTS = Math.floor(MAX_POLL_TIME_MS / POLL_INTERVAL_MS);

export const CONTENT_TYPE_SUBMIT_LOADING_DELAY_MS = 30000; // 30 seconds to wait for suspend payload

// Agents-api writes PENDING_REVIEW status before the suspendPayload metadata flushes.
// Allow this many consecutive PENDING_REVIEW polls with no suspendPayload before giving up.
export const MAX_PENDING_REVIEW_MISSING_PAYLOAD_RETRIES = 5; // 5 × 10s = 50s max wait
