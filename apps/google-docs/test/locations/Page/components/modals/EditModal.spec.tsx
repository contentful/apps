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
      entryIndex: 0,
      id: 'summary',
      contentTypeId: 'sampleContentType',
      contentTypeName: 'Sample content type',
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
      entryIndex: 0,
      id: 'description',
      contentTypeId: 'sampleContentType',
      contentTypeName: 'Sample content type',
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
  newLocation: {
    id: '',
    title: '',
    fieldMappings: [],
    fieldOptions: [],
  },
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
        mode="exclude"
        viewModel={viewModel}
        title="Exclude content"
        locationSectionDescription="Choose which location to use."
        primaryButtonLabel="Exclude content"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Exclude content' })).toBeTruthy();
      expect(screen.getByText('"Sample selected content"')).toBeTruthy();
      expect(screen.getAllByText('Sample content type')).toHaveLength(2);
      expect(screen.getByText('Choose which location to use.')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Exclude content' })).toBeTruthy();
      expect(screen.queryByText('New location')).toBeNull();
    });
  });

  it('allows selecting and toggling location cards', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        mode="exclude"
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

    expect(summaryCard).toHaveAttribute('aria-pressed', 'false');
    expect(descriptionCard).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(summaryCard);

    await waitFor(() => {
      expect(summaryCard).toHaveAttribute('aria-pressed', 'true');
      expect(descriptionCard).toHaveAttribute('aria-pressed', 'false');
    });

    fireEvent.click(descriptionCard);

    await waitFor(() => {
      expect(summaryCard).toHaveAttribute('aria-pressed', 'true');
      expect(descriptionCard).toHaveAttribute('aria-pressed', 'true');
    });

    fireEvent.click(summaryCard);

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
        mode="assign"
        viewModel={{
          ...viewModel,
          newLocation: {
            id: 'page-event-detail',
            title: "Page: Event detail (Don't enter NRF uncaffeinated.)",
            fieldMappings: [],
            fieldOptions: [
              {
                id: 'title',
                fieldName: 'Title',
                fieldType: 'Symbol',
                fieldDisplayType: 'Short text',
              },
            ],
          },
        }}
        title="Assign content"
        locationSectionDescription=""
        primaryButtonLabel="Move content"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('New location')).toBeTruthy();
      expect(screen.getByText("Page: Event detail (Don't enter NRF uncaffeinated.)")).toBeTruthy();
      expect(screen.getAllByText('Fields')).toHaveLength(1);
      expect(screen.getAllByText('Select one or more')).toHaveLength(1);
    });
  });

  it('does not show destination validation in exclude mode and enables submit once a location is selected', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        mode="exclude"
        viewModel={viewModel}
        title="Exclude content"
        locationSectionDescription="Choose which location to use."
        primaryButtonLabel="Exclude content"
      />
    );

    expect(
      screen.queryByText('No destination entry is available for the entry currently in view.')
    ).toBeNull();
    expect(screen.getByRole('button', { name: 'Exclude content' })).toBeDisabled();

    const locationCards = screen
      .getAllByRole('button')
      .filter((el) => el.getAttribute('aria-pressed') !== null);
    fireEvent.click(locationCards[0]);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Exclude content' })).not.toBeDisabled();
    });
  });

  it('keeps the current location heading visible when the section is empty', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        mode="assign"
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
