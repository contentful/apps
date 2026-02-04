export const AGENT_ID = 'elevenlabs-agent';

/**
 * When true, uses local agents-api at localhost:4111
 * When false, uses production agents-api via sdk.cma
 *
 * Note: For streaming chat, we use the local API directly with fetch
 * since useChat requires a streaming endpoint URL
 */
export const USE_LOCAL_AGENTS_API = true;

/**
 * Local agents-api base URL for development
 */
export const LOCAL_AGENTS_API_URL = 'http://localhost:4111';

/**
 * Build the streaming endpoint URL for the agent
 */
export const getAgentStreamUrl = (spaceId: string, environmentId: string): string => {
  if (USE_LOCAL_AGENTS_API) {
    return `${LOCAL_AGENTS_API_URL}/spaces/${spaceId}/environments/${environmentId}/ai_agents/agents/${AGENT_ID}/stream`;
  }
  // For production, we'd need to use a different approach since useChat requires a URL
  // This could be a proxy endpoint or direct CMA streaming (not yet supported)
  throw new Error('Production streaming not yet supported - use USE_LOCAL_AGENTS_API = true');
};
