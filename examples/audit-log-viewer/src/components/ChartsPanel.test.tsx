import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AuditEvent } from '../lib/events';
import { ChartsPanel } from './ChartsPanel';

const ev = (activity: string, actorName: string, timeIso: string): AuditEvent => ({
  time: Date.parse(timeIso),
  timeIso,
  activity,
  actorType: 'User',
  actorId: actorName,
  actorName,
  entityType: 'Entry',
  entityId: 'e',
  spaceId: 's',
  spaceName: 's',
  path: '/p',
  method: 'PUT',
  status: 200,
  raw: {},
});

describe('ChartsPanel', () => {
  it('renders three chart headings', () => {
    const { getByText } = render(
      <ChartsPanel
        events={[
          ev('Update', 'Jane', '2026-06-28T10:00:00.000Z'),
          ev('Delete', 'Bob', '2026-06-29T10:00:00.000Z'),
        ]}
      />,
    );
    expect(getByText('Events over time')).toBeInTheDocument();
    expect(getByText('Top actors')).toBeInTheDocument();
    expect(getByText('Actions')).toBeInTheDocument();
  });
});
