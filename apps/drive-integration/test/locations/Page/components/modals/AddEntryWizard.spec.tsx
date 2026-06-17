import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import {
  AddEntryWizard,
  WizardStep,
  INITIAL_WIZARD_STATE,
  type WizardState,
} from '../../../../../src/locations/Page/components/review/mapping/edit-modals/AddEntryWizard';
import type { EditModalNewLocation } from '@types';

vi.mock(
  '../../../../../src/locations/Page/components/review/mapping/edit-modals/FieldSelectionDropdown',
  () => ({
    FieldSelectionDropdown: () => <div>Field selection</div>,
  })
);

const contentTypes = [
  { sys: { id: 'article' }, name: 'Article', fields: [] },
  { sys: { id: 'page' }, name: 'Page', fields: [] },
];

const existingEntries = [
  { tempId: 'entry-1', label: 'Blog post' },
  { tempId: 'entry-2', label: 'Landing page' },
];

const referenceFieldOptions = [
  {
    id: 'relatedArticles',
    fieldName: 'Related articles',
    fieldType: 'Array',
    fieldDisplayType: 'Reference list',
  },
  { id: 'author', fieldName: 'Author', fieldType: 'Link', fieldDisplayType: 'Reference' },
];

const newLocation: EditModalNewLocation = {
  id: 'article',
  entryIndex: 0,
  title: 'Article: My article',
  fieldOptions: [],
  fieldMappings: [],
  initialFieldIds: [],
};

const buildNewLocation = vi.fn(() => newLocation);

const makeState = (overrides: Partial<WizardState> = {}): WizardState => ({
  ...INITIAL_WIZARD_STATE,
  ...overrides,
});

const renderWizard = (state: WizardState, onChange = vi.fn()) =>
  render(
    <AddEntryWizard
      state={state}
      onChange={onChange}
      contentTypes={contentTypes as any}
      existingEntries={existingEntries}
      referenceFieldOptions={referenceFieldOptions}
      selectedText="Some text"
      isImageContent={false}
      buildNewLocation={buildNewLocation}
    />
  );

describe('AddEntryWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ContentType step', () => {
    it('renders content type options', async () => {
      renderWizard(makeState());

      await waitFor(() => {
        expect(screen.getByText('Article')).toBeTruthy();
        expect(screen.getByText('Page')).toBeTruthy();
      });
    });

    it('calls onChange with contentTypeId when a type is selected', async () => {
      const onChange = vi.fn();
      renderWizard(makeState(), onChange);

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'article' } });

      expect(onChange).toHaveBeenCalledWith({ contentTypeId: 'article' });
    });
  });

  describe('IsReference step', () => {
    it('renders Yes and No radio options', async () => {
      renderWizard(makeState({ step: WizardStep.IsReference, contentTypeId: 'article' }));

      await waitFor(() => {
        expect(screen.getByLabelText('Yes')).toBeTruthy();
        expect(screen.getByLabelText('No')).toBeTruthy();
      });
    });

    it('calls onChange with isReference: true when Yes is clicked', async () => {
      const onChange = vi.fn();
      renderWizard(makeState({ step: WizardStep.IsReference, contentTypeId: 'article' }), onChange);

      fireEvent.click(screen.getByLabelText('Yes'));

      expect(onChange).toHaveBeenCalledWith({ isReference: true });
    });

    it('calls onChange with isReference: false when No is clicked', async () => {
      const onChange = vi.fn();
      renderWizard(makeState({ step: WizardStep.IsReference, contentTypeId: 'article' }), onChange);

      fireEvent.click(screen.getByLabelText('No'));

      expect(onChange).toHaveBeenCalledWith({ isReference: false });
    });
  });

  describe('SelectReference step', () => {
    it('renders existing entry options', async () => {
      renderWizard(
        makeState({ step: WizardStep.SelectReference, contentTypeId: 'article', isReference: true })
      );

      await waitFor(() => {
        expect(screen.getByText('Blog post')).toBeTruthy();
        expect(screen.getByText('Landing page')).toBeTruthy();
      });
    });

    it('calls onChange with referenceEntryId when an entry is selected', async () => {
      const onChange = vi.fn();
      renderWizard(
        makeState({
          step: WizardStep.SelectReference,
          contentTypeId: 'article',
          isReference: true,
        }),
        onChange
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'entry-1' } });

      expect(onChange).toHaveBeenCalledWith({ referenceEntryId: 'entry-1' });
    });
  });

  describe('SelectReferenceField step', () => {
    it('renders reference field options', async () => {
      renderWizard(
        makeState({
          step: WizardStep.SelectReferenceField,
          contentTypeId: 'article',
          isReference: true,
          referenceEntryId: 'entry-1',
        })
      );

      await waitFor(() => {
        expect(screen.getByText('Related articles (Reference list)')).toBeTruthy();
        expect(screen.getByText('Author (Reference)')).toBeTruthy();
      });
    });

    it('calls onChange with referenceFieldId when a field is selected', async () => {
      const onChange = vi.fn();
      renderWizard(
        makeState({
          step: WizardStep.SelectReferenceField,
          contentTypeId: 'article',
          isReference: true,
          referenceEntryId: 'entry-1',
        }),
        onChange
      );

      const select = screen.getByRole('combobox');
      fireEvent.change(select, { target: { value: 'author' } });

      expect(onChange).toHaveBeenCalledWith({ referenceFieldId: 'author' });
    });
  });

  describe('SelectFields step', () => {
    it('calls buildNewLocation with the selected content type id', async () => {
      renderWizard(makeState({ step: WizardStep.SelectFields, contentTypeId: 'article' }));

      await waitFor(() => {
        expect(buildNewLocation).toHaveBeenCalledWith('article');
      });
    });

    it('renders the field selection component', async () => {
      renderWizard(makeState({ step: WizardStep.SelectFields, contentTypeId: 'article' }));

      await waitFor(() => {
        expect(screen.getByText('Field selection')).toBeTruthy();
      });
    });
  });
});
