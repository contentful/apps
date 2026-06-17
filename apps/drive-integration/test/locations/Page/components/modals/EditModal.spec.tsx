import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { EditModal } from '../../../../../src/locations/Page/components/review/mapping/edit-modals/EditModal';
import React from 'react';

const onClose = vi.fn();

const baseNewLocation = {
  id: 'page-event-detail',
  entryIndex: 0,
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
  newLocations: [baseNewLocation],
};

describe('EditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('renders the provided title and button label', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={baseViewModel}
        title="Edit content mapping"
        primaryButtonLabel="Save"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit content mapping' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    });
  });

  it('renders the new location section when newLocations is non-empty', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={baseViewModel}
        title="Edit content mapping"
        primaryButtonLabel="Save"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('New location')).toBeTruthy();
      expect(screen.getByText('Event detail')).toBeTruthy();
    });
  });

  it('primary button is disabled when no changes have been made', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={baseViewModel}
        title="Edit content mapping"
        primaryButtonLabel="Save"
      />
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });
  });

  it('renders an empty new location list when newLocations is empty', async () => {
    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={{
          ...baseViewModel,
          newLocations: [],
        }}
        title="Edit content mapping"
        primaryButtonLabel="Save"
      />
    );

    await waitFor(() => {
      expect(screen.queryByText('Event detail')).toBeNull();
    });
  });

  it('renders multiple entry sections when multiple newLocations are provided', async () => {
    const secondLocation = {
      id: 'component-hero',
      entryIndex: 1,
      title: 'Component: Resource detail hero',
      fieldMappings: [],
      fieldOptions: [
        {
          id: 'headline',
          fieldName: 'Headline',
          fieldType: 'Symbol',
          fieldDisplayType: 'Short text',
          isAssetField: false,
        },
      ],
      initialFieldIds: [],
    };

    render(
      <EditModal
        isOpen={true}
        onClose={onClose}
        viewModel={{
          ...baseViewModel,
          newLocations: [baseNewLocation, secondLocation],
        }}
        title="Edit content mapping"
        primaryButtonLabel="Save"
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Event detail')).toBeTruthy();
      expect(screen.getByText('Resource detail hero')).toBeTruthy();
    });
  });
});
