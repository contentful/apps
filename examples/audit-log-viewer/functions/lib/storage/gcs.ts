import { selectLogFiles } from './select';
import { base64UrlEncode, rsaSha256Sign, sha256Hex } from './webcrypto';
import type { GcsConfig, ListResult, LogStorageProvider } from './types';

const HOST = 'storage.googleapis.com';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const SCOPE = 'https://www.googleapis.com/auth/devstorage.read_only';
const URL_TTL_SECONDS = 900;
const ERROR_DETAIL_MAX_LENGTH = 200;
const encoder = new TextEncoder();

/**
 * Extracts a short, non-sensitive detail from a GCS/OAuth error body. Accepts
 * either an already-parsed body (object) or a raw string, and tolerates
 * empty/absent/unparseable bodies, returning '' when nothing usable is found.
 * Handles the JSON API's `{ error: { message } }` shape and the token
 * endpoint's `{ error_description }` (and OAuth `{ error }`) shape.
 */
export function gcsErrorDetail(body: unknown): string {
  let parsed: unknown = body;
  if (typeof body === 'string') {
    if (!body.trim()) return '';
    try {
      parsed = JSON.parse(body);
    } catch {
      return '';
    }
  }
  if (!parsed || typeof parsed !== 'object') return '';
  const obj = parsed as Record<string, unknown>;
  const errorField = obj.error;
  let detail: unknown;
  if (errorField && typeof errorField === 'object') {
    detail = (errorField as Record<string, unknown>).message;
  } else if (typeof errorField === 'string') {
    detail = errorField;
  }
  detail = detail ?? obj.error_description;
  if (typeof detail !== 'string' || !detail.trim()) return '';
  return detail.slice(0, ERROR_DETAIL_MAX_LENGTH);
}

export interface GcsKey {
  client_email: string;
  private_key: string;
}

export function gcsDatestamps(now: Date): { date: string; timestamp: string } {
  const iso = now.toISOString(); // 2026-07-04T01:02:03.000Z
  const date = iso.slice(0, 10).replace(/-/g, '');
  return { date, timestamp: `${date}T${iso.slice(11, 19).replace(/:/g, '')}Z` };
}

/** V4 canonical query (already alphabetical). https://cloud.google.com/storage/docs/access-control/signed-urls */
export function gcsCanonicalQuery(key: GcsKey, now: Date, expires = URL_TTL_SECONDS): string {
  const { date, timestamp } = gcsDatestamps(now);
  const credential = `${key.client_email}/${date}/auto/storage/goog4_request`;
  return (
    'X-Goog-Algorithm=GOOG4-RSA-SHA256' +
    `&X-Goog-Credential=${encodeURIComponent(credential)}` +
    `&X-Goog-Date=${timestamp}` +
    `&X-Goog-Expires=${expires}` +
    '&X-Goog-SignedHeaders=host'
  );
}

export function gcsResourcePath(bucket: string, object: string): string {
  return `/${bucket}/${object.split('/').map(encodeURIComponent).join('/')}`;
}

export function gcsCanonicalRequest(path: string, canonicalQuery: string): string {
  return ['GET', path, canonicalQuery, `host:${HOST}`, '', 'host', 'UNSIGNED-PAYLOAD'].join('\n');
}

export function gcsStringToSign(timestamp: string, date: string, canonicalRequestHashHex: string): string {
  return ['GOOG4-RSA-SHA256', timestamp, `${date}/auto/storage/goog4_request`, canonicalRequestHashHex].join('\n');
}

const toHex = (bytes: Uint8Array) => [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');

export async function gcsSignedUrl(key: GcsKey, bucket: string, object: string, now: Date): Promise<string> {
  const { date, timestamp } = gcsDatestamps(now);
  const path = gcsResourcePath(bucket, object);
  const query = gcsCanonicalQuery(key, now);
  const hash = await sha256Hex(gcsCanonicalRequest(path, query));
  const sig = await rsaSha256Sign(key.private_key, gcsStringToSign(timestamp, date, hash));
  return `https://${HOST}${path}?${query}&X-Goog-Signature=${toHex(sig)}`;
}

export async function gcsAccessToken(key: GcsKey, fetchFn: typeof fetch, now: Date): Promise<string> {
  const iat = Math.floor(now.getTime() / 1000);
  const header = base64UrlEncode(encoder.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = base64UrlEncode(
    encoder.encode(
      JSON.stringify({ iss: key.client_email, scope: SCOPE, aud: TOKEN_URL, iat, exp: iat + 3600 }),
    ),
  );
  const unsigned = `${header}.${claims}`;
  const assertion = `${unsigned}.${base64UrlEncode(await rsaSha256Sign(key.private_key, unsigned))}`;
  const res = await fetchFn(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:
      `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}` +
      `&assertion=${assertion}`,
  });
  if (!res.ok) {
    const detail = gcsErrorDetail(await readGcsErrorBody(res));
    throw new Error(`GCS token exchange failed: HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) throw new Error('GCS token exchange returned no access_token');
  return data.access_token;
}

/** Reads an error response body defensively: text once, then try JSON. */
async function readGcsErrorBody(res: Response): Promise<unknown> {
  let text: string;
  try {
    text = await res.text();
  } catch {
    return undefined;
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

type Deps = { fetchFn?: typeof fetch; now?: () => Date };

export class GcsLogStorage implements LogStorageProvider {
  private readonly fetchFn: typeof fetch;
  private readonly now: () => Date;
  private readonly key: GcsKey;

  constructor(
    private readonly cfg: GcsConfig,
    deps: Deps = {},
  ) {
    this.fetchFn = deps.fetchFn ?? ((input, init) => fetch(input, init)); // wrapped: detached fetch throws Illegal invocation in the workerd runtime
    this.now = deps.now ?? (() => new Date());
    this.key = JSON.parse(cfg.gcsServiceAccountKey) as GcsKey; // shape pre-validated by readConfig
  }

  async listLogFiles(startDate: string, endDate: string): Promise<ListResult> {
    const now = this.now();
    const token = await gcsAccessToken(this.key, this.fetchFn, now);
    const prefix = `${this.cfg.prefix ?? ''}contentful-audit-`;

    const objects: Array<{ key: string; size: number }> = [];
    let pageToken = '';
    do {
      const url =
        `https://${HOST}/storage/v1/b/${encodeURIComponent(this.cfg.gcsBucketName)}/o` +
        `?prefix=${encodeURIComponent(prefix)}&fields=${encodeURIComponent('items(name,size),nextPageToken')}` +
        (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
      const res = await this.fetchFn(url, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) {
        const detail = gcsErrorDetail(await readGcsErrorBody(res));
        throw new Error(`GCS list failed: HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
      }
      const data = (await res.json()) as {
        items?: Array<{ name: string; size?: string | number }>;
        nextPageToken?: string;
      };
      for (const item of data.items ?? []) {
        if (item.name) objects.push({ key: item.name, size: Number(item.size ?? 0) });
      }
      pageToken = data.nextPageToken ?? '';
    } while (pageToken);

    const { selected, truncated } = selectLogFiles(objects, startDate, endDate);
    const files = await Promise.all(
      selected.map(async (m) => ({
        ...m,
        url: await gcsSignedUrl(this.key, this.cfg.gcsBucketName, m.key, now),
      })),
    );
    return { files, truncated };
  }
}
