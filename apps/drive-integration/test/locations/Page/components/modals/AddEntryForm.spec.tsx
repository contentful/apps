import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import {
  AddEntryForm,
  INITIAL_ADD_ENTRY_FORM_STATE,
  isAddEntrySaveDisabled,
  toAddEntryFormParams,
  type AddEntryFormState,
  type ExistingEntryOption,
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
    sys: { id: 'component' },
    name: 'Component',
    fields: [{ id: 'title', name: 'Title', type: 'Symbol' }],
  },
  {
    sys: { id: 'tag' },
    name: 'Tag',
    fields: [{ id: 'label', name: 'Label', type: 'Symbol' }],
  },
];

const existingEntries: ExistingEntryOption[] = [
  { tempId: 'entry-1', label: 'Blog post', contentTypeId: 'article' },
  { tempId: 'entry-2', label: 'Landing page', contentTypeId: 'page' },
];

const entriesWithoutRefFields: ExistingEntryOption[] = [
  { tempId: 'tag-1', label: 'A tag', contentTypeId: 'tag' },
];

const makeState = (overrides: Partial<AddEntryFormState> = {}): AddEntryFormState => ({
  ...INITIAL_ADD_ENTRY_FORM_STATE,
  ...overrides,
});

const renderForm = (
  state: AddEntryFormState,
  onChange = vi.fn(),
  entries: ExistingEntryOption[] = existingEntries
) =>
  render(
    <AddEntryForm
      state={state}
      onChange={onChange}
      contentTypes={contentTypes as any}
      existingEntries={entries}
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

    it('hides radios, parent select, and field multiselect until content type is selected', async () => {
      renderForm(makeState());

      await waitFor(() => {
        expect(screen.getByText('Select content type')).toBeTruthy();
      });

      expect(
        screen.queryByText('Should this new entry be a reference of an existing entry?')
      ).toBeNull();
      expect(
        screen.queryByText('Which existing entry should this new entry be a reference to?')
      ).toBeNull();
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
      renderForm(makeState({ contentTypeId: 'component' }));

      await waitFor(() => {
        expect(
          screen.getByText('Should this new entry be a reference of an existing entry?')
        ).toBeTruthy();
        expect(screen.getByLabelText('Yes')).toBeTruthy();
        expect(screen.getByLabelText('No')).toBeTruthy();
        expect(screen.getByText('Select the field(s) the content should map to')).toBeTruthy();
        expect(screen.getByText('Field selection')).toBeTruthy();
      });

      expect(
        screen.queryByText('Which existing entry should this new entry be a reference to?')
      ).toBeNull();
      expect(screen.queryByText('Which field on the parent should link to this entry?')).toBeNull();
    });

    it('calls onChange with isReference: true when Yes is clicked', async () => {
      const onChange = vi.fn();
      renderForm(makeState({ contentTypeId: 'component' }), onChange);

      fireEvent.click(screen.getByLabelText('Yes'));

      expect(onChange).toHaveBeenCalledWith({ isReference: true });
    });

    it('clears reference ids when No is clicked', async () => {
      const onChange = vi.fn();
      renderForm(
        makeState({
          contentTypeId: 'component',
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

    it('shows parent entry select when Yes is selected', async () => {
      renderForm(
        makeState({
          contentTypeId: 'component',
          isReference: true,
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Which existing entry should this new entry be a reference to?')
        ).toBeTruthy();
        expect(screen.getByText('Blog post')).toBeTruthy();
        expect(screen.getByText('Landing page')).toBeTruthy();
        expect(screen.getByText('Field selection')).toBeTruthy();
      });
    });

    it('shows parent reference fields from the parent content type, not the new entry type', async () => {
      // New entry is a Component (no ref fields); parent is Article (two ref fields)
      renderForm(
        makeState({
          contentTypeId: 'component',
          isReference: true,
          referenceEntryId: 'entry-1',
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Which field on the parent should link to this entry?')
        ).toBeTruthy();
        expect(screen.getByText('Related articles (Reference list)')).toBeTruthy();
        expect(screen.getByText('Author (Reference)')).toBeTruthy();
      });
    });

    it('hides parent field select when parent has only one reference field', async () => {
      renderForm(
        makeState({
          contentTypeId: 'component',
          isReference: true,
          referenceEntryId: 'entry-2',
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Which existing entry should this new entry be a reference to?')
        ).toBeTruthy();
      });

      expect(screen.queryByText('Which field on the parent should link to this entry?')).toBeNull();
    });

    it('disables Yes only when no existing parent can accept a reference', async () => {
      renderForm(makeState({ contentTypeId: 'component' }), vi.fn(), entriesWithoutRefFields);

      await waitFor(() => {
        expect(screen.getByLabelText('Yes')).toBeDisabled();
        expect(screen.getByLabelText('No')).not.toBeDisabled();
      });
    });

    it('keeps Yes enabled when the new entry type has no reference fields but a parent can', async () => {
      renderForm(makeState({ contentTypeId: 'tag' }));

      await waitFor(() => {
        expect(screen.getByLabelText('Yes')).not.toBeDisabled();
        expect(screen.getByLabelText('No')).not.toBeDisabled();
      });
    });

    it('hides parent field select until a parent entry is chosen', async () => {
      renderForm(
        makeState({
          contentTypeId: 'component',
          isReference: true,
          referenceEntryId: '',
        })
      );

      await waitFor(() => {
        expect(
          screen.getByText('Which existing entry should this new entry be a reference to?')
        ).toBeTruthy();
      });

      expect(screen.queryByText('Which field on the parent should link to this entry?')).toBeNull();
    });

    it('hides parent selects when No is selected', async () => {
      renderForm(
        makeState({
          contentTypeId: 'component',
          isReference: false,
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Field selection')).toBeTruthy();
      });

      expect(
        screen.queryByText('Which existing entry should this new entry be a reference to?')
      ).toBeNull();
      expect(screen.queryByText('Which field on the parent should link to this entry?')).toBeNull();
    });

    it('resets referenceFieldId when parent entry changes', async () => {
      const onChange = vi.fn();
      renderForm(
        makeState({
          contentTypeId: 'component',
          isReference: true,
          referenceEntryId: 'entry-1',
          referenceFieldId: 'author',
        }),
        onChange
      );

      const selects = screen.getAllByRole('combobox');
      fireEvent.change(selects[1], { target: { value: 'entry-2' } });

      expect(onChange).toHaveBeenCalledWith({
        referenceEntryId: 'entry-2',
        referenceFieldId: '',
      });
    });

    it('calls onChange with referenceFieldId when a parent field is selected', async () => {
      const onChange = vi.fn();
      renderForm(
        makeState({
          contentTypeId: 'component',
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
          contentTypes as any,
          existingEntries
        )
      ).toBe(true);
    });

    it('is disabled when isReference is null', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({ contentTypeId: 'component', isReference: null, selectedFieldIds: ['title'] }),
          contentTypes as any,
          existingEntries
        )
      ).toBe(true);
    });

    it('is disabled when No but no fields selected', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({ contentTypeId: 'component', isReference: false, selectedFieldIds: [] }),
          contentTypes as any,
          existingEntries
        )
      ).toBe(true);
    });

    it('is enabled when No and fields selected', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'component',
            isReference: false,
            selectedFieldIds: ['title'],
          }),
          contentTypes as any,
          existingEntries
        )
      ).toBe(false);
    });

    it('is disabled when Yes but no parent entry', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'component',
            isReference: true,
            referenceEntryId: '',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any,
          existingEntries
        )
      ).toBe(true);
    });

    it('is disabled when Yes and parent needs a field but none selected', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'component',
            isReference: true,
            referenceEntryId: 'entry-1',
            referenceFieldId: '',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any,
          existingEntries
        )
      ).toBe(true);
    });

    it('is enabled when Yes with parent, field, and selected fields', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'component',
            isReference: true,
            referenceEntryId: 'entry-1',
            referenceFieldId: 'author',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any,
          existingEntries
        )
      ).toBe(false);
    });

    it('is enabled when Yes with parent that has a single reference field', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'component',
            isReference: true,
            referenceEntryId: 'entry-2',
            referenceFieldId: '',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any,
          existingEntries
        )
      ).toBe(false);
    });

    it('is disabled when Yes but selected parent has no reference fields', () => {
      expect(
        isAddEntrySaveDisabled(
          makeState({
            contentTypeId: 'component',
            isReference: true,
            referenceEntryId: 'tag-1',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any,
          [...existingEntries, ...entriesWithoutRefFields]
        )
      ).toBe(true);
    });
  });

  describe('toAddEntryFormParams', () => {
    it('auto-picks the sole parent reference field when none is selected', () => {
      expect(
        toAddEntryFormParams(
          makeState({
            contentTypeId: 'component',
            isReference: true,
            referenceEntryId: 'entry-2',
            referenceFieldId: '',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any,
          existingEntries
        )
      ).toEqual({
        contentTypeId: 'component',
        isReference: true,
        referenceEntryId: 'entry-2',
        referenceFieldId: 'author',
        fieldIds: ['title'],
      });
    });

    it('clears reference fields when isReference is false', () => {
      expect(
        toAddEntryFormParams(
          makeState({
            contentTypeId: 'component',
            isReference: false,
            referenceEntryId: 'entry-1',
            referenceFieldId: 'author',
            selectedFieldIds: ['title'],
          }),
          contentTypes as any,
          existingEntries
        )
      ).toEqual({
        contentTypeId: 'component',
        isReference: false,
        referenceEntryId: null,
        referenceFieldId: null,
        fieldIds: ['title'],
      });
    });
  });
});
