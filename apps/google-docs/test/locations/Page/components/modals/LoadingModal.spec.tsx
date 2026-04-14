import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { Modal } from '@contentful/f36-components';
import { LoadingModal } from '../../../../../src/locations/Page/components/modals/LoadingModal';

describe('LoadingModal', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const renderLoadingModal = () =>
    render(
      <Modal isShown onClose={vi.fn()}>
        <LoadingModal
          step="reviewingContentTypes"
          title="Preparing your preview"
          contentTypeCount={2}
          onClose={vi.fn()}
        />
      </Modal>
    );

  it('shows the first active step without ellipsis', () => {
    renderLoadingModal();

    const firstRow = screen.getByText('Fetching document').closest('div');

    expect(screen.getByText('Fetching document')).toBeTruthy();
    expect(screen.queryByText('Fetching document...')).toBeNull();
    expect(firstRow?.querySelector('[data-test-id="cf-ui-spinner"]')).toBeTruthy();
  });

  it('moves the active indicator to the newest visible step over time', () => {
    vi.useFakeTimers();

    renderLoadingModal();

    act(() => {
      vi.advanceTimersByTime(20000);
    });

    const firstRow = screen.getByText('Fetching document').closest('div');
    const secondRow = screen.getByText('Analyzing document structure').closest('div');

    expect(screen.getByText('Fetching document')).toBeTruthy();
    expect(screen.getByText('Analyzing document structure')).toBeTruthy();
    expect(firstRow?.querySelector('[data-test-id="cf-ui-spinner"]')).toBeNull();
    expect(secondRow?.querySelector('[data-test-id="cf-ui-spinner"]')).toBeTruthy();
  });
});
