import { DOMParser } from '@xmldom/xmldom';
import { selectLogFiles } from './select';
import { base64Decode, base64Encode, hmacSha256 } from './webcrypto';
import type { AzureConfig, ListResult, LogStorageProvider } from './types';

export const AZURE_SAS_VERSION = '2022-11-02';
const URL_TTL_SECONDS = 900;
const ERROR_DETAIL_MAX_LENGTH = 200;

/**
 * Extracts a short, non-sensitive detail from an Azure blob-service error body
 * (XML: <Error><Code>...</Code><Message>...</Message></Error>, sometimes with
 * <AuthenticationErrorDetail> for signature mismatches). Tolerates empty/absent
 * bodies and returns '' when nothing usable is found.
 */
export function azureErrorDetail(body: string): string {
  if (!body) return '';
  const code = /<Code>([^<]*)<\/Code>/.exec(body)?.[1];
  const authDetail = /<AuthenticationErrorDetail>([^<]*)<\/AuthenticationErrorDetail>/.exec(
    body
  )?.[1];
  const message = /<Message>([^<]*)<\/Message>/.exec(body)?.[1];
  const detail = authDetail ?? message;
  const parts = [code, detail].filter((p): p is string => Boolean(p && p.trim()));
  return parts.join(': ').slice(0, ERROR_DETAIL_MAX_LENGTH);
}

export interface AzureSasInput {
  permissions: 'r' | 'l';
  resource: 'b' | 'c';
  /** /blob/{account}/{container}[/{blobName}] */
  canonicalizedResource: string;
  /** ISO-8601 without milliseconds, e.g. 2026-07-04T00:15:00Z */
  expiryIso: string;
}

/**
 * Service-SAS string-to-sign for the blob service, version 2020-12-06+.
 * Sixteen newline-separated fields; we leave start time, identifier, IP,
 * snapshot time, encryption scope and the five response-header overrides
 * empty. https://learn.microsoft.com/rest/api/storageservices/create-service-sas
 */
export function azureSasStringToSign(i: AzureSasInput): string {
  return [
    i.permissions, // signedPermissions (sp)
    '', // signedStart (st)
    i.expiryIso, // signedExpiry (se)
    i.canonicalizedResource,
    '', // signedIdentifier
    '', // signedIP
    'https', // signedProtocol (spr)
    AZURE_SAS_VERSION, // signedVersion (sv)
    i.resource, // signedResource (sr)
    '', // signedSnapshotTime
    '', // signedEncryptionScope
    '', // rscc
    '', // rscd
    '', // rsce
    '', // rscl
    '', // rsct
  ].join('\n');
}

/** Returns the SAS query string (sv/spr/se/sr/sp/sig). */
export async function azureMintSas(accountKeyBase64: string, i: AzureSasInput): Promise<string> {
  let keyBytes: Uint8Array;
  try {
    keyBytes = base64Decode(accountKeyBase64);
  } catch {
    throw new Error('azureAccountKey is not valid base64');
  }
  const sig = await hmacSha256(keyBytes, azureSasStringToSign(i));
  const q = new URLSearchParams({
    sv: AZURE_SAS_VERSION,
    spr: 'https',
    se: i.expiryIso,
    sr: i.resource,
    sp: i.permissions,
    sig: base64Encode(sig),
  });
  return q.toString();
}

type Deps = { fetchFn?: typeof fetch; now?: () => Date };

export class AzureLogStorage implements LogStorageProvider {
  private readonly fetchFn: typeof fetch;
  private readonly now: () => Date;

  constructor(private readonly cfg: AzureConfig, deps: Deps = {}) {
    if (!/^[a-z0-9]{3,24}$/.test(cfg.azureAccountName)) {
      throw new Error('azureAccountName must be 3-24 lowercase letters/digits');
    }
    this.fetchFn = deps.fetchFn ?? ((input, init) => fetch(input, init)); // wrapped: detached fetch throws Illegal invocation in the workerd runtime
    this.now = deps.now ?? (() => new Date());
  }

  private containerUrl(): string {
    return `https://${this.cfg.azureAccountName}.blob.core.windows.net/${this.cfg.azureContainerName}`;
  }

  private containerResource(): string {
    return `/blob/${this.cfg.azureAccountName}/${this.cfg.azureContainerName}`;
  }

  private expiryIso(): string {
    return new Date(this.now().getTime() + URL_TTL_SECONDS * 1000)
      .toISOString()
      .replace(/\.\d{3}Z$/, 'Z');
  }

  async listLogFiles(startDate: string, endDate: string): Promise<ListResult> {
    const prefix = `${this.cfg.prefix ?? ''}contentful-audit-`;
    const expiryIso = this.expiryIso();
    const listSas = await azureMintSas(this.cfg.azureAccountKey, {
      permissions: 'l',
      resource: 'c',
      canonicalizedResource: this.containerResource(),
      expiryIso,
    });

    const objects: Array<{ key: string; size: number }> = [];
    let marker = '';
    do {
      const url =
        `${this.containerUrl()}?restype=container&comp=list` +
        `&prefix=${encodeURIComponent(prefix)}` +
        (marker ? `&marker=${encodeURIComponent(marker)}` : '') +
        `&${listSas}`;
      const res = await this.fetchFn(url);
      if (!res.ok) {
        const detail = azureErrorDetail(await res.text());
        throw new Error(`Azure list failed: HTTP ${res.status}${detail ? ` — ${detail}` : ''}`);
      }
      // Azure prefixes its XML with a UTF-8 BOM, which xmldom rejects.
      const xml = (await res.text()).replace(/^\uFEFF/, '');
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const blobs = doc.getElementsByTagName('Blob');
      for (let i = 0; i < blobs.length; i++) {
        const blob = blobs.item(i);
        const name = blob?.getElementsByTagName('Name').item(0)?.textContent ?? '';
        const size = Number(
          blob?.getElementsByTagName('Content-Length').item(0)?.textContent ?? '0'
        );
        if (name) objects.push({ key: name, size });
      }
      marker = doc.getElementsByTagName('NextMarker').item(0)?.textContent?.trim() ?? '';
    } while (marker);

    const { selected, truncated } = selectLogFiles(objects, startDate, endDate);
    const files = await Promise.all(
      selected.map(async (m) => ({
        ...m,
        url:
          `${this.containerUrl()}/${m.key.split('/').map(encodeURIComponent).join('/')}?` +
          (await azureMintSas(this.cfg.azureAccountKey, {
            permissions: 'r',
            resource: 'b',
            canonicalizedResource: `${this.containerResource()}/${m.key}`,
            expiryIso,
          })),
      }))
    );
    return { files, truncated };
  }
}
