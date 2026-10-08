import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ReferenceSelectionDialog from '../../src/locations/ReferenceSelectionDialog';
import type { CloneReferenceEntry } from '../../src/utils/EntryCloner';

let invocationParameters: { rootEntryId: string; referenceEntries: CloneReferenceEntry[] };

const mockSdk = {
  parameters: {
    get invocation() {
      return invocationParameters;
    },
  },
  close: vi.fn(),
};

vi.mock('@contentful/react-apps-toolkit', () => ({
  useSDK: () => mockSdk,
  useAutoResizer: () => {},
}));

// root → branch0 → shared, root → branch1 → shared, branch1 → only1
const referenceEntries: CloneReferenceEntry[] = [
  {
    entryId: 'root',
    label: 'Root',
    contentTypeId: 'page',
    depth: 0,
    referencedByCount: 0,
    parentEntryId: null,
    childEntryIds: ['branch0', 'branch1'],
  },
  {
    entryId: 'branch0',
    label: 'Branch 0',
    contentTypeId: 'section',
    depth: 1,
    referencedByCount: 1,
    parentEntryId: 'root',
    childEntryIds: ['shared'],
  },
  {
    entryId: 'shared',
    label: 'Shared Leaf',
    contentTypeId: 'block',
    depth: 2,
    referencedByCount: 2,
    parentEntryId: 'branch0',
    childEntryIds: [],
  },
  {
    entryId: 'branch1',
    label: 'Branch 1',
    contentTypeId: 'section',
    depth: 1,
    referencedByCount: 1,
    parentEntryId: 'root',
    childEntryIds: ['shared', 'only1'],
  },
  {
    entryId: 'only1',
    label: 'Only Under Branch 1',
    contentTypeId: 'block',
    depth: 2,
    referencedByCount: 1,
    parentEntryId: 'branch1',
    childEntryIds: [],
  },
];

describe('ReferenceSelectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invocationParameters = { rootEntryId: 'root', referenceEntries };
  });

  it('counts each unique referenced entry once', () => {
    render(<ReferenceSelectionDialog />);

    expect(screen.getByText('Selected 4 of 4 referenced entries')).toBeDefined();
  });

  it('deselecting a referenced entry updates the selection count', () => {
    render(<ReferenceSelectionDialog />);

    const sharedCheckbox = screen.getByText('Shared Leaf').closest('label')?.querySelector('input');
    expect(sharedCheckbox).toBeTruthy();
    act(() => {
      sharedCheckbox!.click();
    });

    expect(screen.getByText('Selected 3 of 4 referenced entries')).toBeDefined();
  });

  it('confirms with the selected entry ids', () => {
    render(<ReferenceSelectionDialog />);

    act(() => {
      screen.getByText('Clone selected entries').click();
    });

    expect(mockSdk.close).toHaveBeenCalledTimes(1);
    const closedWith = mockSdk.close.mock.calls[0][0] as string[];
    expect(closedWith.sort()).toEqual(['branch0', 'branch1', 'only1', 'root', 'shared']);
  });

  it('renders entries in the provided structural order', () => {
    render(<ReferenceSelectionDialog />);

    const labels = screen
      .getAllByText(/^(Root|Branch 0|Branch 1|Shared Leaf|Only Under Branch 1)$/)
      .map((element) => element.textContent);
    expect(labels).toEqual(['Root', 'Branch 0', 'Shared Leaf', 'Branch 1', 'Only Under Branch 1']);
  });

  it('indents entries by depth', () => {
    render(<ReferenceSelectionDialog />);

    const rowFor = (entryId: string) => screen.getByTestId(`reference-row-${entryId}`);
    expect(rowFor('root').style.marginLeft).toBe('0px');
    expect(rowFor('branch0').style.marginLeft).toBe('20px');
    expect(rowFor('shared').style.marginLeft).toBe('40px');
  });

  it('hints when an entry is referenced by multiple parents', () => {
    render(<ReferenceSelectionDialog />);

    expect(screen.getByText('block · shared · also referenced by 1 other entry')).toBeDefined();
    expect(screen.getByText('section · branch0')).toBeDefined();
  });

  describe('cascading selection', () => {
    const checkboxFor = (entryId: string) =>
      screen.getByTestId(`reference-row-${entryId}`).querySelector('input') as HTMLInputElement;
    const toggle = (entryId: string) => act(() => checkboxFor(entryId).click());

    it('deselects entries only reachable through a deselected entry', () => {
      render(<ReferenceSelectionDialog />);

      toggle('branch1');

      expect(checkboxFor('branch1').checked).toBe(false);
      expect(checkboxFor('only1').checked).toBe(false);
      expect(screen.getByText('Selected 2 of 4 referenced entries')).toBeDefined();
    });

    it('keeps shared entries selected while another selected parent references them', () => {
      render(<ReferenceSelectionDialog />);

      toggle('branch1');

      expect(checkboxFor('shared').checked).toBe(true);
    });

    it('deselects a shared entry once every parent referencing it is deselected', () => {
      render(<ReferenceSelectionDialog />);

      toggle('branch0');
      expect(checkboxFor('shared').checked).toBe(true);

      toggle('branch1');
      expect(checkboxFor('shared').checked).toBe(false);
      expect(screen.getByText('Selected 0 of 4 referenced entries')).toBeDefined();
    });

    it('reselecting an entry restores the entries nested under it', () => {
      render(<ReferenceSelectionDialog />);

      toggle('branch1');
      toggle('branch1');

      expect(checkboxFor('only1').checked).toBe(true);
      expect(screen.getByText('Selected 4 of 4 referenced entries')).toBeDefined();
    });

    it('selecting a nested entry reselects its parent chain', () => {
      render(<ReferenceSelectionDialog />);

      toggle('branch1');
      toggle('only1');

      expect(checkboxFor('branch1').checked).toBe(true);
      expect(checkboxFor('only1').checked).toBe(true);
    });

    it('handles reference cycles without looping', () => {
      invocationParameters = {
        rootEntryId: 'root',
        referenceEntries: [
          { ...referenceEntries[0]!, childEntryIds: ['loop'] },
          {
            entryId: 'loop',
            label: 'Loop',
            contentTypeId: 'section',
            depth: 1,
            referencedByCount: 1,
            parentEntryId: 'root',
            childEntryIds: ['root'],
          },
        ],
      };
      render(<ReferenceSelectionDialog />);

      toggle('loop');
      expect(checkboxFor('loop').checked).toBe(false);
      toggle('loop');
      expect(checkboxFor('loop').checked).toBe(true);
    });
  });
});
