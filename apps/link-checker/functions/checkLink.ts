/**
 * Contentful App Function: check a URL and return its HTTP status.
 * Used by the Link Checker sidebar when the space supports App Functions (Premium/Partners).
 * Invoked via App Action "checkLink" with parameters: { url: string }.
 */

const TIMEOUT_MS = 10000;

// Hyphenated so WAF rules matching the substring "linkchecker" (any case) don't block probes.
export const LINK_CHECKER_USER_AGENT =
  'Mozilla/5.0 (compatible; Contentful-Link-Checker/1.0; +https://www.contentful.com/marketplace/link-checker/)';

export interface CheckLinkParameters {
  url?: string;
}

export interface CheckLinkEvent {
  body: CheckLinkParameters;
}

export interface CheckLinkResult {
  status?: number;
  error?: string;
  /** The site answered with a bot-protection challenge, so the link's real status is unknown. */
  challenged?: boolean;
}

// Interactive challenges need a JS-capable browser; no request header can pass them.
const CHALLENGE_HEADERS: Record<string, string[]> = {
  'cf-mitigated': ['challenge'],
  'x-vercel-mitigated': ['challenge'],
  // AWS WAF answers a challenge with 202, which would otherwise read as a valid link.
  'x-amzn-waf-action': ['challenge', 'captcha'],
};

export function isBotChallenge(response: Pick<Response, 'headers'>): boolean {
  return Object.entries(CHALLENGE_HEADERS).some(([header, values]) => {
    const value = response.headers?.get(header)?.toLowerCase();
    return value != null && values.includes(value);
  });
}

// Query strings can carry signed tokens, so only origin + path reach the logs.
function redactUrl(url: string): string {
  try {
    const { origin, pathname } = new URL(url);
    return origin + pathname;
  } catch {
    return '[unparseable url]';
  }
}

function logProbe(details: Record<string, unknown>): void {
  console.log(JSON.stringify({ source: 'checkLink', ...details }));
}

export async function checkUrl(url: string): Promise<CheckLinkResult> {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { error: 'URL must use http or https' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const fetchOptions: RequestInit = {
    redirect: 'follow',
    signal: controller.signal,
    headers: {
      'User-Agent': LINK_CHECKER_USER_AGENT,
    },
  };

  try {
    let method: 'HEAD' | 'GET' = 'HEAD';
    let response = await fetch(trimmed, { ...fetchOptions, method });

    // Some servers block or mishandle HEAD (e.g. return 403/503). Try GET and use status only.
    if (response.status >= 400) {
      const getResponse = await fetch(trimmed, { ...fetchOptions, method: 'GET' });
      if (getResponse.ok || getResponse.status < 500) {
        response = getResponse;
        method = 'GET';
      }
    }

    clearTimeout(timeout);
    const challenged = isBotChallenge(response);
    logProbe({
      url: redactUrl(trimmed),
      method,
      status: response.status,
      responseUrl: response.url ? redactUrl(response.url) : undefined,
      challenged,
    });
    return challenged ? { status: response.status, challenged } : { status: response.status };
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Request failed';
    logProbe({
      url: redactUrl(trimmed),
      error: message,
    });
    return { error: message };
  }
}

export const handler = async (event: CheckLinkEvent): Promise<CheckLinkResult> => {
  const url = event?.body?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return { error: 'Missing or invalid url parameter' };
  }

  return checkUrl(url);
};
