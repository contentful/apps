import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EditModal } from '../../../../../src/locations/Page/components/review/mapping/edit-modals/EditModal';
import React from 'react';

const onClose = vi.fn();
const onConfirmPrimary = vi.fn();

const baseNewLocation = {
  id: 'page-event-detail',
  title: 'Page: Event detail',
  fieldMappings: [],
  fieldOptions: [
    {
      id: 'title',
      fieldName: 'Title',
      fieldType: 'Symbol',
      fieldDisplayType: 'Short text',
      isAssetField: false,
    },
    {
      id: 'summary',
      fieldName: 'Summary',
      fieldType: 'Text',
      fieldDisplayType: 'Long text',
      isAssetField: false,
    },
  ],
  initialFieldIds: [],
};

const baseViewModel = {
  selectedText: 'Sample selected content',
  isOpen: true,
  isImageContent: false,
  currentLocations: [],
  newLocation: baseNewLocation,
};

describe('EditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the provided title and button label', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={baseViewModel}
        title="Edit content mapping"
        primaryButtonLabel="Apply"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit content mapping' })).toBeTruthy();
      expect(screen.getByText('"Sample selected content"')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Apply' })).toBeTruthy();
    });
  });

  it('renders the "Assign to fields" section when newLocation has an id', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={baseViewModel}
        title="Edit content mapping"
        primaryButtonLabel="Apply"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Assign to fields')).toBeTruthy();
      expect(screen.getByText('Page: Event detail')).toBeTruthy();
    });
  });

  it('primary button is disabled when selectedFieldIds equals initialFieldIds (no change)', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={{ ...baseViewModel, newLocation: { ...baseNewLocation, initialFieldIds: [] } }}
        title="Edit content mapping"
        primaryButtonLabel="Apply"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    });
  });

  it('does not render the "Assign to fields" section when newLocation has no id', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={{
          ...baseViewModel,
          newLocation: {
            id: '',
            title: '',
            fieldMappings: [],
            fieldOptions: [],
            initialFieldIds: [],
          },
        }}
        title="Edit content mapping"
        primaryButtonLabel="Apply"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Assign to fields')).toBeNull();
    });
  });
});
