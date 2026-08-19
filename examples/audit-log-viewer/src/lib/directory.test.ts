// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { applyDirectory, type Directory } from './directory';
import type { AuditEvent } from './events';

function makeEvent(overrides: Partial<AuditEvent> = {}): AuditEvent {
  return {
    time: 0,
    timeIso: '2026-06-29T10:00:00.000Z',
    activity: 'Update',
    actorType: 'User',
    actorId: 'u1',
    actorName: 'u1',
    entityType: 'Entry',
    entityId: 'e1',
    spaceId: 'sp1',
    spaceName: 'sp1',
    path: '/spaces/sp1/entries/e1',
    method: 'PUT',
    status: 200,
    raw: {},
    ...overrides,
  };
}

describe('applyDirectory', () => {
  it('resolves user actor names and space names from the maps', () => {
    const dir: Directory = {
      users: new Map([['u1', 'Jane Smith']]),
      spaces: new Map([['sp1', 'My Space']]),
    };
    const [resolved] = applyDirectory([makeEvent()], dir);
    expect(resolved.actorName).toBe('Jane Smith');
    expect(resolved.spaceName).toBe('My Space');
  });

  it('leaves App actors and unknown ids untouched', () => {
    const dir: Directory = {
      users: new Map([['u1', 'Jane Smith']]),
      spaces: new Map(),
    };
    const [resolved] = applyDirectory(
      [makeEvent({ actorType: 'App', actorId: 'app1', actorName: 'app1', spaceId: 'unknown', spaceName: 'unknown' })],
      dir,
    );
    expect(resolved.actorName).toBe('app1');
    expect(resolved.spaceName).toBe('unknown');
  });

  it('returns the same array when both maps are empty', () => {
    const events = [makeEvent()];
    const dir: Directory = { users: new Map(), spaces: new Map() };
    expect(applyDirectory(events, dir)).toBe(events);
  });
});
