import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import { Modal } from '@contentful/f36-components';
import { LoadingModal } from '../../../../../src/locations/Page/components/modals/LoadingModal';

describe('LoadingModal', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  const renderLoadingModal = (progressMessages: string[] = ['Analyzing document structure']) =>
    render(
      <Modal isShown onClose={vi.fn()}>
        <LoadingModal
          step="reviewingContentTypes"
          title="Preparing your preview"
          progressMessages={progressMessages}
        />
      </Modal>
    );

  it('shows the current step with a spinner', () => {
    renderLoadingModal(['Analyzing document structure']);

    const row = screen.getByText('Analyzing document structure').closest('div');

    expect(screen.getByText('Analyzing document structure')).toBeTruthy();
    expect(row?.querySelector('[data-test-id="cf-ui-spinner"]')).toBeTruthy();
  });

  it('does not render a close button', () => {
    renderLoadingModal();

    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });

  it('shows all accumulated messages and puts the spinner on the last one', () => {
    renderLoadingModal([
      'Analyzing document structure',
      'Classifying tables and preparing assets',
    ]);

    const firstRow = screen.getByText('Analyzing document structure').closest('div');
    const secondRow = screen.getByText('Classifying tables and preparing assets').closest('div');

    expect(firstRow?.querySelector('[data-test-id="cf-ui-spinner"]')).toBeNull();
    expect(secondRow?.querySelector('[data-test-id="cf-ui-spinner"]')).toBeTruthy();
  });
});
