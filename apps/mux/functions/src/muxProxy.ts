import { FunctionEventHandler } from '@contentful/node-apps-toolkit';
import {
  AppActionRequest,
  FunctionEventContext,
  FunctionTypeEnum,
} from '@contentful/node-apps-toolkit/lib/requests/typings';
import { muxFetch, resolveMuxUrl } from './helpers/muxClient';

type Parameters = {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  body?: string;
};

/**
 * Turns a Mux error body into something an editor can act on.
 *
 * The documented Mux shape is `{ error: { type, messages: [...] } }`, and that is what this
 * handled before — but only `messages[0]`, and with a bare `'Unknown error'` for anything else.
 * Both halves of that were wrong in practice:
 *
 * - **Every message matters on a validation error.** A rejected job lists one message per bad
 *   field, so taking the first turns "these three parameters are invalid" into one of the three.
 * - **`'Unknown error'` is the worst possible string to show.** It is what the editor sees when
 *   the body does not match the expected shape, and it tells them nothing — not even that Mux
 *   was the one who said no. Robots is newer than the rest of the API and not every failure comes
 *   back in the Video API's envelope, so the fallbacks below are tried in turn and the status code
 *   is used as a last resort. "Mux rejected this request (HTTP 400)" is a worse message than a
 *   real one and a much better message than nothing.
 *
 * Only the messages are forwarded, never the whole body: the type plus the messages is everything
 * the UI needs, and the rest is not ours to hand out.
 */
function readMuxErrorMessage(body: unknown, status: number): string {
  const asRecord = (value: unknown): Record<string, unknown> | undefined =>
    value && typeof value === 'object' ? (value as Record<string, unknown>) : undefined;

  const joinStrings = (value: unknown): string | undefined => {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (!Array.isArray(value)) return undefined;
    const parts = value
      .map((entry) =>
        typeof entry === 'string' ? entry : (asRecord(entry)?.message as string | undefined)
      )
      .filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
      .map((entry) => entry.trim());
    return parts.length > 0 ? parts.join(' ') : undefined;
  };

  const root = asRecord(body);
  const error = asRecord(root?.error);

  return (
    // The documented shape, with every message rather than just the first.
    joinStrings(error?.messages) ??
    // Singular variants seen elsewhere in Mux's surface.
    joinStrings(error?.message) ??
    joinStrings(root?.messages) ??
    joinStrings(root?.message) ??
    // A bare array of errors, or of `{ message }` objects.
    joinStrings(root?.errors) ??
    // `error` as a plain string, e.g. `{ "error": "invalid_parameters" }`.
    joinStrings(root?.error) ??
    // Nothing recognisable. Say who rejected it and with what, which is still actionable.
    `Mux rejected this request (HTTP ${status})`
  );
}

/** The Mux APIs this app calls. Anything else is refused before it reaches Mux. */
const ALLOWED_PATH_PREFIXES = ['/video/v1/', '/robots/v0/'];

export const handler: FunctionEventHandler<FunctionTypeEnum.AppActionCall> = async (
  event: AppActionRequest<'Custom', Parameters>,
  context: FunctionEventContext
) => {
  const { method, path, body } = event.body;
  const { muxAccessTokenId, muxAccessTokenSecret } = context.appInstallationParameters;

  if (!muxAccessTokenId || !muxAccessTokenSecret) {
    console.error('[muxProxy] Missing Mux credentials in appInstallationParameters');
    return { ok: false, error: 'Missing Mux API credentials', status: 401 };
  }

  let resolvedPath: string;
  try {
    resolvedPath = resolveMuxUrl(path).pathname;
  } catch (err) {
    console.error(`[muxProxy] Rejected invalid path: ${method} ${path}`);
    return { ok: false, error: 'Path not permitted', status: 403 };
  }

  if (!ALLOWED_PATH_PREFIXES.some((prefix) => resolvedPath.startsWith(prefix))) {
    console.error(`[muxProxy] Rejected disallowed path: ${method} ${path} -> ${resolvedPath}`);
    return { ok: false, error: 'Path not permitted', status: 403 };
  }

  let res: Response;
  try {
    res = await muxFetch(
      { tokenId: muxAccessTokenId, tokenSecret: muxAccessTokenSecret },
      method,
      path,
      body
    );
  } catch (err) {
    console.error(`[muxProxy] Network error on ${method} ${path}:`, err);
    return { ok: false, error: 'Network error calling Mux API', status: 502 };
  }

  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    const errorMessage = readMuxErrorMessage(errorBody, res.status);
    // Mux's machine-readable error discriminator, e.g. `robots_units_limit_exceeded`. Without it
    // the browser only has a status code and an English sentence, so a units-exhausted 403 is
    // indistinguishable from a missing-scope 403 — and the Robots tab has to tell those apart to
    // show the right explainer. Forwarded rather than the whole body: `type` plus the first
    // message is everything the UI needs, and the rest of the body is not ours to hand out.
    const errorType = errorBody?.error?.type;
    console.error(
      `[muxProxy] Error ${res.status} on ${method} ${path}: ${errorMessage}${
        errorType ? ` (type: ${errorType})` : ''
      }`
    );
    return {
      ok: false,
      error: errorMessage,
      errorType,
      status: res.status,
    };
  }

  if (res.status === 204) {
    return { ok: true, data: {} };
  }

  const responseBody = await res.json();
  return { ok: true, data: responseBody };
};
