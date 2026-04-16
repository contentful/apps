/**
 * Extract URLs from entry fields (Symbol, Text, Rich Text, and List of Symbol/Text) for link checking.
 * Used by the Sidebar link checker.
 */

const URL_REGEX =
  /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9.\-]+)((?:\/[\+~%\/.\w\-_]*)?\??(?:[\-\+=&;%@.\w_]*)#?(?:[.\!\/\\\w\-]*))?)/gi;

/** Matches relative paths: /path, ./path, ../path (not //). Preceded by start, whitespace, or punctuation so we don't match the path portion of an absolute URL. */
const RELATIVE_PATH_REGEX = /(?:^|[\s(,"'])((?:\.\.?\/|\/(?!\/))[^\s"'<>)\]]+)/g;

export interface ExtractedUrl {
  url: string;
  fieldId: string;
  fieldName: string;
  locale: string;
}

/** Returns true if the URL is relative (not http/https). */
export function isRelativeUrl(url: string): boolean {
  const t = url.trim();
  return !/^(?:https?:\/\/|www\.)/i.test(t);
}

function isPlainEmailAddress(url: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(url);
}

function countOccurrences(value: string, target: string): number {
  return [...value].filter((character) => character === target).length;
}

function trimTrailingUrlPunctuation(value: string): string {
  let normalized = value.trim();

  while (normalized && /[.,;:!?]$/.test(normalized)) {
    normalized = normalized.slice(0, -1);
  }

  while (
    normalized.endsWith(')') &&
    countOccurrences(normalized, ')') > countOccurrences(normalized, '(')
  ) {
    normalized = normalized.slice(0, -1);
  }

  while (
    normalized.endsWith(']') &&
    countOccurrences(normalized, ']') > countOccurrences(normalized, '[')
  ) {
    normalized = normalized.slice(0, -1);
  }

  return normalized;
}

function normalizeExtractedUrl(value: string): string {
  const trimmed = trimTrailingUrlPunctuation(value);
  if (!trimmed) return '';

  if (/^www\./i.test(trimmed)) {
    return `https://${trimmed}`;
  }

  return trimmed;
}

/** Field-like shape from sdk.entry.fields[id] */
interface FieldLike {
  id: string;
  name: string;
  type: string;
  locales: string[];
  getValue: (locale?: string) => unknown;
}

/** Entry-like shape with fields map */
interface EntryLike {
  fields: Record<string, FieldLike>;
}

const STRING_FIELD_TYPES = ['Symbol', 'Text'];
const RICH_TEXT_FIELD_TYPE = 'RichText';

/** Rich Text node with optional content and data */
interface RichTextNode {
  nodeType?: string;
  content?: RichTextNode[];
  data?: { uri?: string };
}

function extractUrlsFromRichTextValue(
  node: RichTextNode | undefined,
  fieldId: string,
  fieldName: string,
  locale: string,
  result: ExtractedUrl[],
  seen: Set<string>
): void {
  if (!node) return;
  if (node.nodeType === 'hyperlink' && node.data?.uri) {
    const url = normalizeExtractedUrl(node.data.uri);
    if (url) {
      const key = `${url}\0${fieldId}\0${locale}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ url, fieldId, fieldName, locale });
      }
    }
  }
  for (const child of node.content || []) {
    extractUrlsFromRichTextValue(child, fieldId, fieldName, locale, result, seen);
  }
}

/**
 * Extract all URLs from string-type fields (Short text, Long text) and Rich Text
 * fields of an entry. For Rich Text, only external hyperlinks (data.uri) are included.
 */
export function extractUrlsFromEntry(entry: EntryLike): ExtractedUrl[] {
  const result: ExtractedUrl[] = [];
  const seen = new Set<string>();

  const fields = entry.fields || {};
  for (const fieldId of Object.keys(fields)) {
    const field = fields[fieldId];
    if (!field) continue;

    const locales = field.locales || [];
    for (const locale of locales) {
      const value = field.getValue(locale);

      if (
        field.type === RICH_TEXT_FIELD_TYPE &&
        value &&
        typeof value === 'object' &&
        !Array.isArray(value)
      ) {
        const doc = value as RichTextNode;
        extractUrlsFromRichTextValue(doc, fieldId, field.name || fieldId, locale, result, seen);
        continue;
      }

      const stringValues: string[] = Array.isArray(value)
        ? (value as unknown[]).filter((v): v is string => typeof v === 'string')
        : typeof value === 'string' && STRING_FIELD_TYPES.includes(field.type)
        ? [value]
        : [];

      for (const text of stringValues) {
        URL_REGEX.lastIndex = 0;
        let match: RegExpExecArray | null;
        while ((match = URL_REGEX.exec(text)) !== null) {
          const url = normalizeExtractedUrl(match[0]);
          if (!url) continue;
          if (isPlainEmailAddress(url)) continue;
          const key = `${url}\0${fieldId}\0${locale}`;
          if (seen.has(key)) continue;
          seen.add(key);
          result.push({
            url,
            fieldId,
            fieldName: field.name || fieldId,
            locale,
          });
        }

        RELATIVE_PATH_REGEX.lastIndex = 0;
        while ((match = RELATIVE_PATH_REGEX.exec(text)) !== null) {
          const url = normalizeExtractedUrl(match[1]);
          if (!url) continue;
          const key = `${url}\0${fieldId}\0${locale}`;
          if (seen.has(key)) continue;
          seen.add(key);
          result.push({
            url,
            fieldId,
            fieldName: field.name || fieldId,
            locale,
          });
        }
      }
    }
  }

  return result;
}
