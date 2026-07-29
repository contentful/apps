export const WORKFLOW_AGENT_ID = 'google-docs-workflow-agent';

export const POLL_INTERVAL_MS = 10000; // 10 seconds

const MAX_POLL_TIME_MS = 20 * 60 * 1000; // 20 minutes
const EXTENDED_POLL_TIME_MS = 60 * 60 * 1000; // 60 minutes (google-docs-agent-improvements flag)

export const MAX_POLL_ATTEMPTS = Math.floor(MAX_POLL_TIME_MS / POLL_INTERVAL_MS);
export const EXTENDED_MAX_POLL_ATTEMPTS = Math.floor(EXTENDED_POLL_TIME_MS / POLL_INTERVAL_MS);

export const CONTENT_TYPE_SUBMIT_LOADING_DELAY_MS = 500; // brief delay before showing loading modal to avoid flash on fast responses

// Agents-api writes PENDING_REVIEW status before the suspendPayload metadata flushes.
// Allow this many consecutive PENDING_REVIEW polls with no suspendPayload before giving up.
export const MAX_PENDING_REVIEW_MISSING_PAYLOAD_RETRIES = 5; // 5 × 10s = 50s max wait

// Hard cap on tab selection to prevent oversized payloads and single-LLM-call timeouts.
// Revisit once parallel per-entry mappers (M7) ship.
export const MAX_TABS_SELECTION = 20;
