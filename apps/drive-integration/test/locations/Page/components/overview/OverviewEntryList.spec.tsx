import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ValidationFindingSeverity } from '@types';
import type { ValidationFinding } from '@types';
import type { EntryListRow } from '../../../../../src/utils/overviewEntryList';
import { OverviewEntryList } from '../../../../../src/locations/Page/components/overview/OverviewEntryList';

const makeRow = (entryIndex: number, label: string): EntryListRow => ({
  id: `row-${entryIndex}`,
  entryIndex,
  contentTypeName: 'Article',
  entryTitle: label,
  children: [],
});

const renderList = (
  rows: EntryListRow[],
  findingsByEntryIndex?: ReadonlyMap<number, ValidationFinding[]>
) =>
  render(
    <OverviewEntryList
      rows={rows}
      selectedEntryIndex={null}
      selectedEntryKeys={new Set()}
      onSelect={vi.fn()}
      onToggleEntrySelection={vi.fn()}
      findingsByEntryIndex={findingsByEntryIndex}
    />
  );

afterEach(() => cleanup());

describe('OverviewEntryList — validation finding badges (INTEG-4383)', () => {
  it('renders a "Needs attention" badge for entries with block findings', () => {
    const rows = [makeRow(0, 'Entry A')];
    const findings: ValidationFinding[] = [
      {
        code: 'required-field-missing',
        message: 'title missing',
        severity: ValidationFindingSeverity.Block,
        entryIndex: 0,
      },
    ];
    renderList(rows, new Map([[0, findings]]));

    expect(screen.getByText('Needs attention')).toBeTruthy();
    expect(screen.queryByText('Warning')).toBeNull();
  });

  it('renders a "Warning" badge for entries with only warn findings', () => {
    const rows = [makeRow(0, 'Entry A')];
    const findings: ValidationFinding[] = [
      {
        code: 'displayField-blank',
        message: 'title blank',
        severity: ValidationFindingSeverity.Warn,
        entryIndex: 0,
      },
    ];
    renderList(rows, new Map([[0, findings]]));

    expect(screen.getByText('Warning')).toBeTruthy();
    expect(screen.queryByText('Needs attention')).toBeNull();
  });

  it('renders "Needs attention" (not Warning) when entry has both block and warn findings', () => {
    const rows = [makeRow(0, 'Entry A')];
    const findings: ValidationFinding[] = [
      {
        code: 'required-field-missing',
        message: 'title missing',
        severity: ValidationFindingSeverity.Block,
        entryIndex: 0,
      },
      {
        code: 'displayField-blank',
        message: 'title blank',
        severity: ValidationFindingSeverity.Warn,
        entryIndex: 0,
      },
    ];
    renderList(rows, new Map([[0, findings]]));

    expect(screen.getByText('Needs attention')).toBeTruthy();
    expect(screen.queryByText('Warning')).toBeNull();
  });

  it('renders no finding badges when findingsByEntryIndex is undefined', () => {
    const rows = [makeRow(0, 'Entry A')];
    renderList(rows, undefined);

    expect(screen.queryByText('Needs attention')).toBeNull();
    expect(screen.queryByText('Warning')).toBeNull();
  });

  it('renders no finding badges for entries with no findings', () => {
    const rows = [makeRow(0, 'Entry A'), makeRow(1, 'Entry B')];
    const findings: ValidationFinding[] = [
      {
        code: 'required-field-missing',
        message: 'title missing',
        severity: ValidationFindingSeverity.Block,
        entryIndex: 1,
      },
    ];
    renderList(rows, new Map([[1, findings]]));

    // Only entry 1 should have the badge
    expect(screen.getAllByText('Needs attention')).toHaveLength(1);
  });
});
