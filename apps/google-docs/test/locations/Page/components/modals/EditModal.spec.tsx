import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditModal } from '../../../../../src/locations/Page/components/review/mapping/edit-modals/EditModal';
import React from 'react';

const onClose = vi.fn();

const viewModel = {
  selectedText: 'Sample selected content',
  isOpen: true,
  currentLocations: [
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
      expect(screen.queryByText('New location')).toBeNull();
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

  it('renders the new location section when provided', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={{
          ...viewModel,
          newLocations: [
            {
              title: "Page: Event detail (Don't enter NRF uncaffeinated.)",
            },
            {
              title: "Component: Resource detail hero (Don't enter NRF uncaffeinated.)",
            },
          ],
        }}
        title="Assign content"
        locationSectionDescription=""
        primaryButtonLabel="Move content"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('New location')).toBeTruthy();
      expect(screen.getByText("Page: Event detail (Don't enter NRF uncaffeinated.)")).toBeTruthy();
      expect(
        screen.getByText("Component: Resource detail hero (Don't enter NRF uncaffeinated.)")
      ).toBeTruthy();
      expect(screen.getAllByText('Fields')).toHaveLength(2);
      expect(screen.getAllByText('Select one or more')).toHaveLength(2);
    });
  });

  it('keeps the current location heading visible when the section is empty', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={{ ...viewModel, currentLocations: [] }}
        title="Assign content"
        locationSectionDescription=""
        primaryButtonLabel="Move content"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Current location')).toBeTruthy();
      expect(
        screen
          .getAllByRole('button')
          .filter((element) => element.getAttribute('aria-pressed') !== null)
      ).toHaveLength(0);
    });
  });
});
