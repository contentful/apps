/**
 * Contentful App Function: check a URL and return its HTTP status.
 * Used by the Link Checker sidebar when the space supports App Functions (Premium/Partners).
 * Invoked via App Action "checkLink" with parameters: { url: string }.
 */

const TIMEOUT_MS = 10000;

interface CheckLinkParameters {
  url?: string;
}

interface CheckLinkEvent {
  body: CheckLinkParameters;
}

export const handler = async (
  event: CheckLinkEvent
): Promise<{ status?: number; error?: string }> => {
  const url = event?.body?.url;
  if (typeof url !== 'string' || !url.trim()) {
    return { error: 'Missing or invalid url parameter' };
  }

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
      'User-Agent':
        'Mozilla/5.0 (compatible; ContentfulLinkChecker/1.0; +https://www.contentful.com/)',
    },
  };

  try {
    let response = await fetch(trimmed, { ...fetchOptions, method: 'HEAD' });

    // Some servers block or mishandle HEAD (e.g. return 403/503). Try GET and use status only.
    if (response.status >= 400) {
      const getResponse = await fetch(trimmed, { ...fetchOptions, method: 'GET' });
      if (getResponse.ok || getResponse.status < 500) {
        response = getResponse;
      }
    }

    clearTimeout(timeout);
    return { status: response.status };
  } catch (err) {
    clearTimeout(timeout);
    const message = err instanceof Error ? err.message : 'Request failed';
    return { error: message };
  }
};
