import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditModal } from '../../../../../src/locations/Page/components/review/mapping/edit-modals/EditModal';
import React from 'react';

const onClose = vi.fn();

const viewModel = {
  selectedText: 'Sample selected content',
  locations: [
    {
      id: 'summary',
      contentTypeId: 'sampleContentType',
      entryName: 'Sample entry',
      fieldId: 'summary',
      fieldName: 'Summary',
      fieldType: 'Long text',
      sourceRef: {
        type: 'blockText' as const,
        blockId: 'mock-block-1',
        start: 0,
        end: 23,
        flattenedRuns: [
          {
            start: 0,
            end: 23,
            text: 'Sample selected content',
            styles: {},
          },
        ],
      },
      isSelected: true,
    },
    {
      id: 'description',
      contentTypeId: 'sampleContentType',
      entryName: 'Sample entry',
      fieldId: 'description',
      fieldName: 'Description',
      fieldType: 'Short text',
      sourceRef: {
        type: 'blockText' as const,
        blockId: 'mock-block-2',
        start: 0,
        end: 23,
        flattenedRuns: [
          {
            start: 0,
            end: 23,
            text: 'Sample selected content',
            styles: {},
          },
        ],
      },
    },
  ],
};

describe('EditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the provided title and configured labels', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={viewModel}
        title="Exclude content"
        locationSectionDescription="Choose which location to use."
        primaryButtonLabel="Exclude content"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Exclude content' })).toBeTruthy();
      expect(screen.getByText('"Sample selected content"')).toBeTruthy();
      expect(screen.getByText('Choose which location to use.')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Exclude content' })).toBeTruthy();
    });
  });

  it('allows switching the selected location card', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={viewModel}
        title="Exclude content"
        locationSectionDescription="Choose which location to use."
        primaryButtonLabel="Exclude content"
      />
    );

    const locationCards = screen
      .getAllByRole('button')
      .filter((element) => element.getAttribute('aria-pressed') !== null);
    const [summaryCard, descriptionCard] = locationCards;

    expect(summaryCard).toHaveAttribute('aria-pressed', 'true');
    expect(descriptionCard).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(descriptionCard);

    await waitFor(() => {
      expect(summaryCard).toHaveAttribute('aria-pressed', 'false');
      expect(descriptionCard).toHaveAttribute('aria-pressed', 'true');
    });
  });
});
