const FILE_RE = /contentful-audit-[A-Za-z0-9_-]+-(\d{4})(\d{2})(\d{2})T\d{9}Z\.json(\.gz)?$/;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Audit log files are named contentful-audit-{orgId}-{YYYYMMDDTHHMMSSsssZ}.json
 * and contain the events of the day BEFORE the export datetime.
 */
export function coveredDateFromKey(key: string): string | null {
  const m = FILE_RE.exec(key);
  if (!m) return null;
  const exportedUtc = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(exportedUtc)) return null;
  return new Date(exportedUtc - DAY_MS).toISOString().slice(0, 10);
}
