export interface AuditEvent {
  time: number;
  timeIso: string;
  activity: string;
  actorType: string;
  actorId: string;
  actorName: string;
  entityType: string;
  entityId: string;
  spaceId: string;
  spaceName: string;
  path: string;
  method: string;
  status?: number;
  raw: Record<string, unknown>;
}

/**
 * Normalise one OCSF Web Resource Activity event (schema 1.3.0).
 * Prefers the nested actor.user fields; falls back to the deprecated
 * top-level actor.type/actor.id. Docs give "time" as
 * "yyyy-MM-dd hh:mm:ss.SSS" with no zone — treated as UTC.
 */
export function normalizeEvent(input: unknown): AuditEvent | null {
  if (!input || typeof input !== 'object') return null;
  const raw = input as Record<string, any>;
  const t = typeof raw.time === 'string' ? raw.time : '';
  let ms = Date.parse(t.includes('T') ? t : `${t.replace(' ', 'T')}Z`);
  if (Number.isNaN(ms)) ms = Date.parse(t);
  if (Number.isNaN(ms)) return null;

  const user = raw.actor?.user;
  const spaceEnrichment = Array.isArray(raw.enrichments)
    ? raw.enrichments.find((e: any) => typeof e?.type === 'string' && /^spaces?$/i.test(e.type))
    : undefined;
  const resource = Array.isArray(raw.web_resources) ? raw.web_resources[0] : undefined;
  const actorId = user?.uid ?? raw.actor?.id ?? '';

  const path = raw.http_request?.url?.path ?? '';
  let spaceId: string = spaceEnrichment?.data?.id ?? '';
  if (!spaceId) {
    const m = /^\/spaces\/([A-Za-z0-9_-]+)/.exec(path);
    spaceId = m?.[1] ?? '';
  }

  return {
    time: ms,
    timeIso: new Date(ms).toISOString(),
    activity: typeof raw.activity_name === 'string' ? raw.activity_name : 'Unknown',
    actorType: user?.type ?? raw.actor?.type ?? 'Unknown',
    actorId,
    actorName: user?.full_name || user?.email_addr || actorId || 'Unknown',
    entityType: resource?.type ?? 'Unknown',
    entityId: resource?.uid ?? '',
    spaceId,
    spaceName: spaceId,
    path,
    method: raw.http_request?.http_method ?? '',
    status: typeof raw.http_response?.code === 'number' ? raw.http_response.code : undefined,
    raw,
  };
}

export function eventsPerDay(events: AuditEvent[]): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const d = e.timeIso.slice(0, 10);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
}

export interface EventFilters {
  actor?: string;
  activity?: string;
  spaceId?: string;
  query?: string;
}

/** Case-insensitive substring search over the fields users actually hunt for. */
export function filterEvents(events: AuditEvent[], f: EventFilters): AuditEvent[] {
  const q = (f.query ?? '').trim().toLowerCase();
  return events.filter(
    (e) =>
      (!f.actor || e.actorName === f.actor) &&
      (!f.activity || e.activity === f.activity) &&
      (!f.spaceId || e.spaceId === f.spaceId) &&
      (!q ||
        e.entityId.toLowerCase().includes(q) ||
        e.entityType.toLowerCase().includes(q) ||
        e.path.toLowerCase().includes(q) ||
        e.actorName.toLowerCase().includes(q) ||
        e.spaceName.toLowerCase().includes(q)),
  );
}

export function topBy(
  events: AuditEvent[],
  key: (e: AuditEvent) => string,
  n = 10,
): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    const k = key(e) || 'Unknown';
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
