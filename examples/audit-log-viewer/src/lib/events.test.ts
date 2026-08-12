// @vitest-environment node
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { eventsPerDay, filterEvents, normalizeEvent, topBy, type AuditEvent } from './events';

const fixture = readFileSync(
  join(__dirname, '../../test-fixtures/contentful-audit-TESTORG-20260630T040000000Z.json'),
  'utf8'
)
  .trim()
  .split('\n')
  .map((l) => JSON.parse(l));

describe('normalizeEvent', () => {
  it('maps a documented OCSF user event', () => {
    const ev = normalizeEvent(fixture[0])!;
    expect(ev.activity).toBe('Update');
    expect(ev.actorName).toBe('Jane Smith');
    expect(ev.actorType).toBe('User');
    expect(ev.entityType).toBe('Entry');
    expect(ev.entityId).toBe('e1');
    expect(ev.spaceId).toBe('sp1');
    expect(ev.method).toBe('PUT');
    expect(ev.status).toBe(200);
    expect(ev.timeIso).toBe('2026-06-29T10:15:42.123Z'); // "time" treated as UTC
  });

  it('falls back to uid for app actors without name/email', () => {
    const ev = normalizeEvent(fixture[1])!;
    expect(ev.actorType).toBe('App');
    expect(ev.actorName).toBe('app1');
  });

  it('accepts ISO timestamps too and rejects garbage', () => {
    expect(normalizeEvent({ time: '2026-06-29T10:15:42.123Z' })).not.toBeNull();
    expect(normalizeEvent({ time: 'never' })).toBeNull();
    expect(normalizeEvent('nope')).toBeNull();
    expect(normalizeEvent(null)).toBeNull();
  });

  it('matches the lowercase plural "spaces" enrichment type seen in real-world events', () => {
    const ev = normalizeEvent({
      time: '2026-06-29T10:00:00.000Z',
      enrichments: [
        {
          name: 'http_request.url.path',
          value: '/spaces/z9kk0r2h6644/environments/master/assets',
          type: 'spaces',
          data: { id: 'z9kk0r2h6644' },
        },
      ],
    })!;
    expect(ev.spaceId).toBe('z9kk0r2h6644');
  });

  it('falls back to the URL path for space id when no enrichment is present', () => {
    const ev = normalizeEvent({
      time: '2026-06-29T10:00:00.000Z',
      http_request: { url: { path: '/spaces/abc123/environments/master/entries' } },
    })!;
    expect(ev.spaceId).toBe('abc123');
  });

  it('leaves spaceId empty for non-space paths like /oauth/token', () => {
    const ev = normalizeEvent({
      time: '2026-06-29T10:00:00.000Z',
      http_request: { url: { path: '/oauth/token' } },
    })!;
    expect(ev.spaceId).toBe('');
  });
});

describe('aggregations', () => {
  const events = fixture.map((f) => normalizeEvent(f)!) as AuditEvent[];

  it('eventsPerDay counts by UTC day ascending', () => {
    expect(eventsPerDay(events)).toEqual([{ date: '2026-06-29', count: 2 }]);
  });

  it('topBy ranks by count descending', () => {
    expect(topBy(events, (e) => e.activity, 1)).toEqual([expect.objectContaining({ count: 1 })]);
    expect(topBy(events, (e) => e.actorName)).toHaveLength(2);
  });
});

describe('filterEvents', () => {
  const events = fixture.map((f) => normalizeEvent(f)!) as AuditEvent[];
  // events[0]: actorName 'Jane Smith', entityId 'e1', spaceId 'sp1',
  //            path '/spaces/sp1/environments/master/entries/e1/published'
  // events[1]: actorName 'app1', entityId 'a1', spaceId 'sp1',
  //            path '/spaces/sp1/environments/master/assets/a1'
  const otherSpaceEvent: AuditEvent = { ...events[1], spaceId: 'sp2', spaceName: 'sp2' };
  const all = [...events, otherSpaceEvent];

  it('returns all events when no filters are set', () => {
    expect(filterEvents(all, {})).toEqual(all);
  });

  it('matches spaceId exactly', () => {
    const result = filterEvents(all, { spaceId: 'sp1' });
    expect(result).toEqual(events);
    expect(result.some((e) => e.spaceId === 'sp2')).toBe(false);
  });

  it('matches entityId case-insensitively via query', () => {
    const result = filterEvents(all, { query: 'E1' });
    expect(result.map((e) => e.entityId)).toEqual(['e1']);
  });

  it('matches a path substring via query', () => {
    const result = filterEvents(all, { query: '/entries/' });
    expect(result).toHaveLength(1);
    expect(result[0].path).toContain('/entries/');
  });

  it('returns an empty array when the query matches nothing', () => {
    expect(filterEvents(all, { query: 'no-such-thing-anywhere' })).toEqual([]);
  });

  it('requires both actor and query to hold when combined', () => {
    const result = filterEvents(all, { actor: 'Jane Smith', query: 'a1' });
    expect(result).toEqual([]);

    const result2 = filterEvents(all, { actor: 'Jane Smith', query: 'e1' });
    expect(result2.map((e) => e.entityId)).toEqual(['e1']);
  });
});
