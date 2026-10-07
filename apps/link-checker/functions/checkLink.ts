/**
 * Contentful App Function: check a URL and return its HTTP status.
 * Used by the Link Checker sidebar when the space supports App Functions (Premium/Partners).
 * Invoked via App Action "checkLink" with parameters: { url: string }.
 */

import { FunctionEventContext } from '@contentful/node-apps-toolkit';

const TIMEOUT_MS = 10000;

export const LINK_CHECKER_USER_AGENT =
  'Mozilla/5.0 (compatible; ContentfulLinkChecker/1.0; +https://www.contentful.com/)';

/**
 * Hyphenated product token avoids WAF rules that match the legacy "LinkChecker" substring
 * while still identifying Contentful.
 */
export const COMPATIBILITY_USER_AGENT =
  'Mozilla/5.0 (compatible; Contentful-Link-Checker/1.0; +https://www.contentful.com/marketplace/link-checker/)';

export interface CheckLinkInstallationParameters {
  useCompatibilityUserAgentForChecks?: boolean;
}

export interface CheckLinkParameters {
  url?: string;
}

export interface CheckLinkEvent {
  body: CheckLinkParameters;
}

export interface CheckLinkResult {
  status?: number;
  error?: string;
}

export interface CheckUrlOptions {
  useCompatibilityUserAgentForChecks?: boolean;
}

export function resolveCheckLinkUserAgent(useCompatibilityUserAgentForChecks?: boolean): string {
  return useCompatibilityUserAgentForChecks ? COMPATIBILITY_USER_AGENT : LINK_CHECKER_USER_AGENT;
}

function logProbe(details: Record<string, unknown>): void {
  console.log(JSON.stringify({ source: 'checkLink', ...details }));
}

export async function checkUrl(
  url: string,
  options: CheckUrlOptions = {}
): Promise<CheckLinkResult> {
  const trimmed = url.trim();
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return { error: 'URL must use http or https' };
  }

  const userAgent = resolveCheckLinkUserAgent(options.useCompatibilityUserAgentForChecks);
  const userAgentMode = options.useCompatibilityUserAgentForChecks ? 'compatibility' : 'link-checker';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const fetchOptions: RequestInit = {
    redirect: 'follow',
    signal: controller.signal,
    headers: {
      'User-Agent': userAgent,
    },
  };

  try {
    let method: 'HEAD' | 'GET' = 'HEAD';
    let response = await fetch(trimmed, { ...fetchOptions, method });

    // Some servers block or mishandle HEAD (e.g. return 403/503). Try GET and use status only.
    if (response.status >= 400) {
      method = 'GET';
      const getResponse = await fetch(trimmed, { ...fetchOptions, method });
      if (getResponse.ok || getResponse.status < 500) {
        response = getResponse;
      }
    }

    clearTimeout(timeout);
    logProbe({
      url: trimmed,
      method,
      status: response.status,
      responseUrl: response.url,
      userAgentMode,
    });
    return { status: response.status };
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Request failed';
    logProbe({
      url: trimmed,
      error: message,
      userAgentMode,
    });
    return { error: message };
  }
}

export const handler = async (
  event: CheckLinkEvent,
  context?: FunctionEventContext & {
    appInstallationParameters?: CheckLinkInstallationParameters;
  }
): Promise<CheckLinkResult> => {
  const url = event?.body?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return { error: 'Missing or invalid url parameter' };
  }

  return checkUrl(url, {
    useCompatibilityUserAgentForChecks:
      context?.appInstallationParameters?.useCompatibilityUserAgentForChecks,
  });
};
