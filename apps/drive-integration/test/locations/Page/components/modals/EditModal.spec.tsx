import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import { EditModal } from '../../../../../src/locations/Page/components/review/mapping/edit-modals/EditModal';
import React from 'react';

const onClose = vi.fn();
const onAddEntry = vi.fn();

const contentTypes = [
  {
    sys: { id: 'article' },
    name: 'Article',
    fields: [
      {
        id: 'relatedArticles',
        name: 'Related articles',
        type: 'Array',
        items: { type: 'Link', linkType: 'Entry' },
      },
      {
        id: 'author',
        name: 'Author',
        type: 'Link',
        linkType: 'Entry',
      },
    ],
  },
  {
    sys: { id: 'page' },
    name: 'Page',
    fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
  },
];

const existingEntries = [
  { tempId: 'entry-1', label: 'Blog post', contentTypeId: 'article' },
  { tempId: 'entry-2', label: 'Landing page', contentTypeId: 'page' },
];

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

const renderEditModal = (overrides: Record<string, unknown> = {}) =>
  render(
    <EditModal
      isOpen={true}
      onClose={onClose}
      viewModel={baseViewModel}
      title="Edit content mapping"
      primaryButtonLabel="Save"
      contentTypes={contentTypes as any}
      existingEntries={existingEntries}
      onAddEntry={onAddEntry}
      {...overrides}
    />
  );

describe('EditModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    cleanup();
    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('renders the provided title and button label', async () => {
    renderEditModal();

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Edit content mapping' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Save' })).toBeTruthy();
    });
  });

  it('renders the new location section when newLocations is non-empty', async () => {
    renderEditModal();

    await waitFor(() => {
      expect(screen.getByText('New location')).toBeTruthy();
      expect(screen.getByText('Event detail')).toBeTruthy();
    });
  });

  it('primary button is disabled when no changes have been made', async () => {
    renderEditModal();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    });
  });

  it('renders an empty new location list when newLocations is empty', async () => {
    renderEditModal({
      viewModel: {
        ...baseViewModel,
        newLocations: [],
      },
    });

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

    renderEditModal({
      viewModel: {
        ...baseViewModel,
        newLocations: [baseNewLocation, secondLocation],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('Event detail')).toBeTruthy();
      expect(screen.getByText('Resource detail hero')).toBeTruthy();
    });
  });

  describe('Add entry form', () => {
    const openAddEntryForm = async () => {
      renderEditModal();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /add entry/i })).toBeTruthy();
      });

      fireEvent.click(screen.getByRole('button', { name: /add entry/i }));

      await waitFor(() => {
        expect(screen.getByText('Add entry')).toBeTruthy();
      });
    };

    it('opens as a single screen with content type select and Save (no Next)', async () => {
      await openAddEntryForm();

      expect(screen.getByText('Select content type')).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Back' })).toBeTruthy();
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
      expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
      expect(
        screen.queryByText('Should this new entry be a reference of an existing entry?')
      ).toBeNull();
    });

    it('shows radios and field multiselect together after content type is selected', async () => {
      await openAddEntryForm();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'page' } });

      await waitFor(() => {
        expect(
          screen.getByText('Should this new entry be a reference of an existing entry?')
        ).toBeTruthy();
        expect(screen.getByLabelText('Yes')).toBeTruthy();
        expect(screen.getByLabelText('No')).toBeTruthy();
        expect(screen.getByText('Select the field(s) the content should map to')).toBeTruthy();
      });

      expect(
        screen.queryByText('Which existing entry should this new entry be a reference to?')
      ).toBeNull();
    });

    it('shows parent entry select when Yes is chosen', async () => {
      await openAddEntryForm();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'article' } });

      await waitFor(() => {
        expect(screen.getByLabelText('Yes')).toBeTruthy();
      });

      fireEvent.click(screen.getByLabelText('Yes'));

      await waitFor(() => {
        expect(
          screen.getByText('Which existing entry should this new entry be a reference to?')
        ).toBeTruthy();
        expect(screen.getByText('Blog post')).toBeTruthy();
      });
    });

    it('calls onAddEntry with the correct params when Save is clicked after filling the form', async () => {
      await openAddEntryForm();

      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'page' } });

      await waitFor(() => {
        expect(screen.getByLabelText('No')).toBeTruthy();
      });

      fireEvent.click(screen.getByLabelText('No'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Toggle Multiselect' })).toBeTruthy();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Toggle Multiselect' }));

      await waitFor(() => {
        expect(screen.getByText('Title')).toBeTruthy();
      });

      fireEvent.click(screen.getByText('Title'));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Save' })).not.toBeDisabled();
      });

      fireEvent.click(screen.getByRole('button', { name: 'Save' }));

      expect(onAddEntry).toHaveBeenCalledWith({
        contentTypeId: 'page',
        isReference: false,
        referenceEntryId: null,
        referenceFieldId: null,
        fieldIds: ['title'],
      });
    });

    it('exits the form when Back is clicked', async () => {
      await openAddEntryForm();

      fireEvent.click(screen.getByRole('button', { name: 'Back' }));

      await waitFor(() => {
        expect(screen.getByText('New location')).toBeTruthy();
        expect(screen.queryByText('Select content type')).toBeNull();
        expect(screen.getByRole('button', { name: /add entry/i })).toBeTruthy();
      });
    });
  });
});
