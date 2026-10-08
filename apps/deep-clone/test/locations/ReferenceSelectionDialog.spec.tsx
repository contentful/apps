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

const referenceEntries: CloneReferenceEntry[] = [
  { entryId: 'root', label: 'Root', contentTypeId: 'page', depth: 0, referencedByCount: 0 },
  {
    entryId: 'branch0',
    label: 'Branch 0',
    contentTypeId: 'section',
    depth: 1,
    referencedByCount: 1,
  },
  {
    entryId: 'shared',
    label: 'Shared Leaf',
    contentTypeId: 'block',
    depth: 2,
    referencedByCount: 2,
  },
  {
    entryId: 'branch1',
    label: 'Branch 1',
    contentTypeId: 'section',
    depth: 1,
    referencedByCount: 1,
  },
];

describe('ReferenceSelectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invocationParameters = { rootEntryId: 'root', referenceEntries };
  });

  it('counts each unique referenced entry once', () => {
    render(<ReferenceSelectionDialog />);

    expect(screen.getByText('Selected 3 of 3 referenced entries')).toBeDefined();
  });

  it('deselecting a referenced entry updates the selection count', () => {
    render(<ReferenceSelectionDialog />);

    const sharedCheckbox = screen.getByText('Shared Leaf').closest('label')?.querySelector('input');
    expect(sharedCheckbox).toBeTruthy();
    act(() => {
      sharedCheckbox!.click();
    });

    expect(screen.getByText('Selected 2 of 3 referenced entries')).toBeDefined();
  });

  it('confirms with the selected entry ids', () => {
    render(<ReferenceSelectionDialog />);

    act(() => {
      screen.getByText('Clone selected entries').click();
    });

    expect(mockSdk.close).toHaveBeenCalledTimes(1);
    const closedWith = mockSdk.close.mock.calls[0][0] as string[];
    expect(closedWith.sort()).toEqual(['branch0', 'branch1', 'root', 'shared']);
  });

  it('renders entries in the provided structural order', () => {
    render(<ReferenceSelectionDialog />);

    const labels = screen
      .getAllByText(/^(Root|Branch 0|Branch 1|Shared Leaf)$/)
      .map((element) => element.textContent);
    expect(labels).toEqual(['Root', 'Branch 0', 'Shared Leaf', 'Branch 1']);
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
});
