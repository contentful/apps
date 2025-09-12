export const getHeaderValue = (headers: unknown, key: string): string | undefined => {
  if (!headers) return undefined;
  const normalize = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
  const targets = new Set([key, key.toLowerCase(), 'content-type', 'Content-Type', 'contentType']);
  const targetNormalized = new Set(Array.from(targets).map((t) => normalize(String(t))));

  const toStringValue = (value: unknown): string => {
    if (value == null) return '';
    if (Array.isArray(value)) return value.map((v) => String(v)).join(', ');
    return String(value);
  };

  try {
    if (typeof Headers !== 'undefined' && headers instanceof Headers) {
      const got = headers.get(key) || headers.get('content-type') || headers.get('Content-Type');
      return got == null ? undefined : got;
    }
  } catch {}

  if (Array.isArray(headers)) {
    for (const entry of headers as any[]) {
      if (Array.isArray(entry) && entry.length >= 2) {
        const [k, v] = entry as [unknown, unknown];
        if (typeof k === 'string' && targetNormalized.has(normalize(k))) return toStringValue(v);
      } else if (entry && typeof entry === 'object') {
        const k = (entry as any).key || (entry as any).name || (entry as any).header;
        const v = (entry as any).value ?? (entry as any).val ?? (entry as any)[1];
        if (typeof k === 'string' && targetNormalized.has(normalize(k))) return toStringValue(v);
      }
    }
  }

  if (typeof headers === 'object') {
    for (const [k, v] of Object.entries(headers as Record<string, unknown>)) {
      if (targetNormalized.has(normalize(k))) return toStringValue(v);
    }
  }

  return undefined;
};

export const isJsonLike = (body: unknown, contentType?: string): boolean => {
  if (body == null) return false;
  if (typeof body !== 'string') return true;
  if (contentType && contentType.toLowerCase().includes('json')) return true;
  const trimmed = body.trim();
  return (
    (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
    (trimmed.startsWith('[') && trimmed.endsWith(']'))
  );
};

export const formatBodyForDisplay = (body?: unknown, contentType?: string): string => {
  if (body == null) return '';
  if (isJsonLike(body, contentType)) {
    try {
      const parsed = typeof body === 'string' ? JSON.parse(body) : body;
      return JSON.stringify(parsed, null, 2);
    } catch {
      return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
    }
  }
  return typeof body === 'string' ? body : JSON.stringify(body, null, 2);
};

export const computeDuration = (createdAt?: string, updatedAt?: string): number | undefined => {
  if (!createdAt || !updatedAt) return undefined;
  return new Date(updatedAt).getTime() - new Date(createdAt).getTime();
};
