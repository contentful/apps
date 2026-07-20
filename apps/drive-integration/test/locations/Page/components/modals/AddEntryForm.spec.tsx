import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import {
  AddEntryForm,
  INITIAL_ADD_ENTRY_FORM_STATE,
  isAddEntrySaveDisabled,
  toAddEntryFormParams,
  type AddEntryFormState,
} from '../../../../../src/locations/Page/components/review/mapping/edit-modals/AddEntryForm';

vi.mock(
  '../../../../../src/locations/Page/components/review/mapping/edit-modals/FieldSelectionDropdown',
  () => ({
    FieldSelectionDropdown: () => <div>Field selection</div>,
  })
);

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
      { id: 'author', name: 'Author', type: 'Link', linkType: 'Entry' },
      { id: 'title', name: 'Title', type: 'Symbol' },
    ],
  },
  {
    sys: { id: 'page' },
    name: 'Page',
    fields: [
      { id: 'author', name: 'Author', type: 'Link', linkType: 'Entry' },
      { id: 'title', name: 'Title', type: 'Symbol' },
    ],
  },
  {
    sys: { id: 'tag' },
    name: 'Tag',
    fields: [{ id: 'label', name: 'Label', type: 'Symbol' }],
  },
];

const existingEntries = [
  { tempId: 'entry-1', label: 'Blog post' },
  { tempId: 'entry-2', label: 'Landing page' },
];

const makeState = (overrides: Partial<AddEntryFormState> = {}): AddEntryFormState => ({
  ...INITIAL_ADD_ENTRY_FORM_STATE,
  ...overrides,
});

const renderForm = (state: AddEntryFormState, onChange = vi.fn()) =>
  render(
    <AddEntryForm
      state={state}
      onChange={onChange}
      contentTypes={contentTypes as any}
      existingEntries={existingEntries}
      selectedText="Some text"
      isImageContent={false}
    />
  );

describe('AddEntryForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('content type select', () => {
    it('renders content type options', async () => {
      renderForm(makeState());

      await waitFor(() => {
        expect(screen.getByText('Article')).toBeTruthy();
        expect(screen.getByText('Page')).toBeTruthy();
      });
    });

    it('hides radios, entry select, and field multiselect until content type is selected', async () => {
      renderForm(makeState());

      await waitFor(() => {
        expect(screen.getByText('Select content type')).toBeTruthy();
      });

      expect(screen.queryByText('Should this entry be a reference entry?')).toBeNull();
      expect(screen.queryByText('Select the entry this should reference')).toBeNull();
      expect(screen.queryByText('Field selection')).toBeNull();
    });

    it('resets dependent state when content type changes', async () => {
      const onChange = vi.fn();
      renderForm(
        makeState({
          contentTypeId: 'page',
          isReference: true,
          referenceEntryId: 'entry-1',
          referenceFieldId: 'author',
          selectedFieldIds: ['title'],
        }),
        onChange
      );

      fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'article' } });

      expect(onChange).toHaveBeenCalledWith({
        contentTypeId: 'article',
        isReference: null,
        referenceEntryId: '',
        referenceFieldId: '',
        selectedFieldIds: [],
      });
    });
  });

  describe('controls after content type is selected', () => {
    it('shows radios and field multiselect together', async () => {
      renderForm(makeState({ contentTypeId: 'article' }));

      await waitFor(() => {
        expect(screen.getByText('Should this entry be a reference entry?')).toBeTruthy();
        expect(screen.getByLabelText('Yes')).toBeTruthy();
        expect(screen.getByLabelText('No')).toBeTruthy();
        expect(screen.getByText('Select the field(s) the content should map to')).toBeTruthy();
        expect(screen.getByText('Field selection')).toBeTruthy();
      });

      expect(screen.queryByText('Select the entry this should reference')).toBeNull();
      expect(screen.queryByText('Which field should connect to this reference?')).toBeNull();
    });

    it('calls onChange with isReference: true when Yes is clicked', async () => {
      const onChange = vi.fn();
      renderForm(makeState({ contentTypeId: 'article' }), onChange);

      fireEvent.click(screen.getByLabelText('Yes'));

      expect(onChange).toHaveBeenCalledWith({ isReference: true });
    });

    it('clears reference ids when No is clicked', async () => {
      const onChange = vi.fn();
      renderForm(
        makeState({
          contentTypeId: 'article',
          isReference: true,
          referenceEntryId: 'entry-1',
          referenceFieldId: 'author',
        }),
        onChange
      );

      fireEvent.click(screen.getByLabelText('No'));

      expect(onChange).toHaveBeenCalledWith({
        isReference: false,
        referenceEntryId: '',
        referenceFieldId: '',
      });
    });

    it('shows entry select when Yes is selected, keeping field multiselect visible', async () => {
      renderForm(
        makeState({
          contentTypeId: 'article',
          isReference: true,
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Select the entry this should reference')).toBeTruthy();
        expect(screen.getByText('Blog post')).toBeTruthy();
        expect(screen.getByText('Landing page')).toBeTruthy();
        expect(screen.getByText('Field selection')).toBeTruthy();
      });
    });

    it('shows reference field select when Yes and multiple reference fields exist', async () => {
      renderForm(
        makeState({
          contentTypeId: 'article',
          isReference: true,
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Which field should connect to this reference?')).toBeTruthy();
        expect(screen.getByText('Related articles (Reference list)')).toBeTruthy();
        expect(screen.getByText('Author (Reference)')).toBeTruthy();
      });
    });

    it('hides reference field select when only one reference field exists', async () => {
      renderForm(
        makeState({
          contentTypeId: 'page',
          isReference: true,
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Select the entry this should reference')).toBeTruthy();
      });

      expect(screen.queryByText('Which field should connect to this reference?')).toBeNull();
    });

    it('disables Yes radio when content type has no reference fields', async () => {
      renderForm(makeState({ contentTypeId: 'tag' }));

      await waitFor(() => {
        expect(screen.getByLabelText('Yes')).toBeDisabled();
        expect(screen.getByLabelText('No')).not.toBeDisabled();
      });
    });

    it('hides entry and reference field selects when No is selected', async () => {
      renderForm(
        makeState({
          contentTypeId: 'article',
          isReference: false,
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Field selection')).toBeTruthy();
      });

      expect(screen.queryByText('Select the entry this should reference')).toBeNull();
      expect(screen.queryByText('Which field should connect to this reference?')).toBeNull();
    });

    it('calls onChange with referenceEntryId when an entry is selected', async () => {
      const onChange = vi.fn();
      renderForm(
        makeState({
          contentTypeId: 'article',
          isReference: true,
        }),
        onChange
      );

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[1], { target: { value: 'entry-1' } });

      expect(onChange).toHaveBeenCalledWith({ referenceEntryId: 'entry-1' });
    });

    it('calls onChange with referenceFieldId when a field is selected', async () => {
      const onChange = vi.fn();
      renderForm(
        makeState({
          contentTypeId: 'article',
          isReference: true,
          referenceEntryId: 'entry-1',
        }),
        onChange
      );

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[2], { target: { value: 'author' } });

      expect(onChange).toHaveBeenCalledWith({ referenceFieldId: 'author' });
    });
  });

  describe('isAddEntrySaveDisabled', () => {
    it('is disabled when content type is empty', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({ contentTypeId: '', isReference: false, selectedFieldIds: ['title'] }),
          contentTypes as any
        )
      ).toBe(true);
    });

    it('is disabled when isReference is null', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({ contentTypeId: 'article', isReference: null, selectedFieldIds: ['title'] }),
          contentTypes as any
        )
      ).toBe(true);
    });

    it('is disabled when No but no fields selected', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({ contentTypeId: 'article', isReference: false, selectedFieldIds: [] }),
          contentTypes as any
        )
      ).toBe(true);
    });

    it('is enabled when No and fields selected', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'article',
            isReference: false,
            selectedFieldIds: ['title'],
          }),
          contentTypes as any
        )
      ).toBe(false);
    });

    it('is disabled when Yes but no reference entry', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'article',
            isReference: true,
            referenceEntryId: '',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any
        )
      ).toBe(true);
    });

    it('is disabled when Yes needs reference field but none selected', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'article',
            isReference: true,
            referenceEntryId: 'entry-1',
            referenceFieldId: '',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any
        )
      ).toBe(true);
    });

    it('is enabled when Yes with entry, field, and selected fields', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'article',
            isReference: true,
            referenceEntryId: 'entry-1',
            referenceFieldId: 'author',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any
        )
      ).toBe(false);
    });

    it('is enabled when Yes with entry and fields when reference field select not needed', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'page',
            isReference: true,
            referenceEntryId: 'entry-1',
            referenceFieldId: '',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any
        )
      ).toBe(false);
    });

    it('is disabled when Yes but content type has no reference fields', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'tag',
            isReference: true,
            referenceEntryId: 'entry-1',
            selectedFieldIds: ['label'],
          }),
          contentTypes as any
        )
      ).toBe(true);
    });
  });

  describe('toAddEntryFormParams', () => {
    it('auto-picks the sole reference field when none is selected', () => {
      expect(
        toAddEntryFormParams(
          makeState({
            contentTypeId: 'page',
            isReference: true,
            referenceEntryId: 'entry-1',
            referenceFieldId: '',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any
        )
      ).toEqual({
        contentTypeId: 'page',
        isReference: true,
        referenceEntryId: 'entry-1',
        referenceFieldId: 'author',
        fieldIds: ['title'],
      });
    });

    it('clears reference fields when isReference is false', () => {
      expect(
        toAddEntryFormParams(
          makeState({
            contentTypeId: 'article',
            isReference: false,
            referenceEntryId: 'entry-1',
            referenceFieldId: 'author',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any
        )
      ).toEqual({
        contentTypeId: 'article',
        isReference: false,
        referenceEntryId: null,
        referenceFieldId: null,
        fieldIds: ['title'],
      });
    });
  });
});
