import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { AuditEvent } from '../lib/events';
import { EventsTable } from './EventsTable';

const ev = (over: Partial<AuditEvent>): AuditEvent => ({
  time: Date.parse('2026-06-29T10:15:42.123Z'),
  timeIso: '2026-06-29T10:15:42.123Z',
  activity: 'Update',
  actorType: 'User',
  actorId: 'u1',
  actorName: 'Jane Smith',
  entityType: 'Entry',
  entityId: 'e1',
  spaceId: 'sp1',
  spaceName: 'sp1',
  path: '/spaces/sp1/entries/e1',
  method: 'PUT',
  status: 200,
  raw: {},
  ...over,
});

describe('EventsTable', () => {
  it('renders one row per event with actor and action', () => {
    render(<EventsTable events={[ev({}), ev({ actorName: 'app1', activity: 'Delete' })]} />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('paginates past 25 rows', () => {
    const events = Array.from({ length: 30 }, (_, i) => ev({ entityId: `e${i}` }));
    render(<EventsTable events={events} />);
    expect(screen.getAllByRole('row')).toHaveLength(26); // header + 25
  });

  it('clamps the page when events shrink below the current offset', () => {
    const many = Array.from({ length: 30 }, (_, i) => ev({ entityId: `e${i}` }));
    const { rerender } = render(<EventsTable events={many} />);

    // Advance to page 2 (0-indexed page 1) via the "Next" button.
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Page 2 shows the remaining 5 events (e25..e29).
    expect(screen.getByText(/e25/)).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(6); // header + 5 remaining rows

    // Shrinking events below the current page's offset must clamp back into range.
    rerender(<EventsTable events={many.slice(0, 3)} />);
    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3 visible rows
  });
});
