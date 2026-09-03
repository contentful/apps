/**
 * `contentful-sdk-core`'s error handler puts a pretty-printed JSON blob in
 * `Error.message` rather than the API's own message, so the useful text is one
 * level down.
 */
function parseNestedErrorBody(message: string): { message?: unknown } | null {
  if (!message.startsWith('{')) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(message);
    return typeof parsed === 'object' && parsed !== null ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * A CMA failure reaches an app in one of three shapes:
 *
 * 1. the raw API error body, carrying `sys.id` and a plain `message`;
 * 2. an `Error` from `contentful-sdk-core`, with the code in `name` and a JSON
 *    blob in `message`;
 * 3. a plain `{ code, message, data }` object, which is what the App Framework
 *    delivers -- the web app relays the rejection into the app's iframe over
 *    `postMessage`, and that crossing drops the prototype along with any
 *    non-enumerable field, so `instanceof Error`, `sys` and `status` are all
 *    gone by the time an app sees it.
 *
 * Only the message survives all three, so it is the one field worth reading.
 */
function extractCmaErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null) {
    return '';
  }

  const rawMessage = (error as { message?: unknown }).message;
  if (typeof rawMessage !== 'string') {
    return '';
  }

  const nested = parseNestedErrorBody(rawMessage);
  return typeof nested?.message === 'string' && nested.message.length > 0
    ? nested.message
    : rawMessage;
}

/**
 * The CMA caps a single response at ~7MB. Content types with large field values
 * can exceed that well below our default page size, and the only way back is to
 * ask for fewer entries per request.
 */
export function isResponseTooBigError(error: unknown): boolean {
  return /response size too big/i.test(extractCmaErrorMessage(error));
}

/**
 * Prefers the API's own message over the JSON blob wrapping it, which also
 * keeps the obscured auth header in that blob out of the UI.
 */
export function extractErrorMessage(error: unknown): string {
  return extractCmaErrorMessage(error) || 'Unknown error';
}
