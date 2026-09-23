import React from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import ReferenceSelectionDialog from '../../src/locations/ReferenceSelectionDialog';
import type { CloneReferenceNode } from '../../src/utils/EntryCloner';

let invocationParameters: { referenceTree: CloneReferenceNode };

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

// Diamond fan-in, no cycle: root -> [branch0, branch1] -> shared leaf.
// buildReferenceNode() produces one CloneReferenceNode per path, so the tree
// contains two separate nodes for "shared", even though it's one entry.
const diamondTree: CloneReferenceNode = {
  entryId: 'root',
  label: 'Root',
  children: [
    {
      entryId: 'branch0',
      label: 'Branch 0',
      children: [{ entryId: 'shared', label: 'Shared Leaf', children: [] }],
    },
    {
      entryId: 'branch1',
      label: 'Branch 1',
      children: [{ entryId: 'shared', label: 'Shared Leaf', children: [] }],
    },
  ],
};

describe('ReferenceSelectionDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invocationParameters = { referenceTree: diamondTree };
  });

  it('counts each unique entry once, not once per tree path (ES-671)', () => {
    render(<ReferenceSelectionDialog />);

    // Unique referenced entries: branch0, branch1, shared = 3.
    // A tree-flatten count without dedup would report 4 (shared counted twice).
    expect(screen.getByText('Selected 3 of 3 referenced entries')).toBeDefined();
  });

  it('deselecting the shared entry once removes it everywhere it appears in the tree', () => {
    render(<ReferenceSelectionDialog />);

    const sharedCheckboxes = screen.getAllByText('Shared Leaf');
    expect(sharedCheckboxes).toHaveLength(2);

    const checkbox = sharedCheckboxes[0].closest('label')?.querySelector('input');
    expect(checkbox).toBeTruthy();
    act(() => {
      checkbox!.click();
    });

    expect(screen.getByText('Selected 2 of 3 referenced entries')).toBeDefined();
  });

  it('confirms with deduped entry ids, not one per tree path', () => {
    render(<ReferenceSelectionDialog />);

    act(() => {
      screen.getByText('Clone selected entries').click();
    });

    expect(mockSdk.close).toHaveBeenCalledTimes(1);
    const closedWith = mockSdk.close.mock.calls[0][0] as string[];
    expect(closedWith.sort()).toEqual(['branch0', 'branch1', 'root', 'shared']);
    expect(new Set(closedWith).size).toBe(closedWith.length);
  });
});
