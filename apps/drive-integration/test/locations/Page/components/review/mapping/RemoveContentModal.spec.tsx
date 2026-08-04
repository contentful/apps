import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RemoveContentModal } from '../../../../../../src/locations/Page/components/review/mapping/edit-modals/RemoveContentModal';
import type { EditLocationOption } from '../../../../../../src/types/editModal';
import React from 'react';

const mockLocation: EditLocationOption = {
  id: 'loc-1',
  entryIndex: 0,
  contentTypeId: 'blogPost',
  contentTypeName: 'Blog Post',
  entryName: 'My Entry',
  fieldId: 'body',
  fieldName: 'Body',
  fieldType: 'RichText',
  sourceRef: { type: 'image', blockId: 'b1', imageId: 'i1' },
};

describe('RemoveContentModal', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.runAllTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('does not render when closed', () => {
    render(
      <RemoveContentModal isOpen={false} onConfirm={vi.fn()} onCancel={vi.fn()} locations={[]} />
    );

    expect(screen.queryByText('Remove content from entry')).toBeNull();
  });

  it('renders the confirmation copy and controls when open', () => {
    render(
      <RemoveContentModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} locations={[]} />
    );

    expect(screen.getByRole('heading', { name: 'Remove content from entry' })).toBeTruthy();
    expect(
      screen.getByText("Are you sure you'd like to remove this content from the entry?")
    ).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Remove' })).toBeTruthy();
  });

  it('calls onConfirm when Remove is clicked', () => {
    const onConfirm = vi.fn();

    render(
      <RemoveContentModal isOpen={true} onConfirm={onConfirm} onCancel={vi.fn()} locations={[]} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();

    render(
      <RemoveContentModal isOpen={true} onConfirm={vi.fn()} onCancel={onCancel} locations={[]} />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not render the mappings list when locations is empty', () => {
    render(
      <RemoveContentModal isOpen={true} onConfirm={vi.fn()} onCancel={vi.fn()} locations={[]} />
    );

    expect(screen.queryByText('The following mappings will be removed:')).toBeNull();
  });

  it('renders the affected mappings list when locations are provided', () => {
    render(
      <RemoveContentModal
        isOpen={true}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        locations={[mockLocation]}
      />
    );

    expect(screen.getByText('The following mappings will be removed:')).toBeTruthy();
    expect(screen.getByText('My Entry')).toBeTruthy();
    expect(screen.getByText('Body')).toBeTruthy();
    expect(screen.getByText('(RichText)')).toBeTruthy();
  });
});
