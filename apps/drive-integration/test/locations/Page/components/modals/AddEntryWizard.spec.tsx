import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import React from 'react';
import {
  AddEntryWizard,
  WizardStep,
  WIZARD_STEPS,
  INITIAL_WIZARD_STATE,
  type Wizard,
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

const makeState = (overrides: Partial<Wizard> = {}): Wizard => ({
  ...INITIAL_WIZARD_STATE,
  ...overrides,
});

const renderWizard = (state: Wizard, onChange = vi.fn()) =>
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

  describe('WIZARD_STEPS routing', () => {
    const baseState = makeState();

    describe('next() transitions', () => {
      it('ContentType → IsReference', () => {
        expect(
          WIZARD_STEPS[WizardStep.ContentType].next(baseState, { needsReferenceFieldStep: true })
        ).toBe(WizardStep.IsReference);
      });

      it('IsReference → SelectReference when isReference is true', () => {
        const state = makeState({ isReference: true });
        expect(
          WIZARD_STEPS[WizardStep.IsReference].next(state, { needsReferenceFieldStep: true })
        ).toBe(WizardStep.SelectReference);
      });

      it('IsReference → SelectFields when isReference is false', () => {
        const state = makeState({ isReference: false });
        expect(
          WIZARD_STEPS[WizardStep.IsReference].next(state, { needsReferenceFieldStep: true })
        ).toBe(WizardStep.SelectFields);
      });

      it('SelectReference → SelectReferenceField when needsReferenceFieldStep is true', () => {
        expect(
          WIZARD_STEPS[WizardStep.SelectReference].next(baseState, {
            needsReferenceFieldStep: true,
          })
        ).toBe(WizardStep.SelectReferenceField);
      });

      it('SelectReference → SelectFields when needsReferenceFieldStep is false', () => {
        expect(
          WIZARD_STEPS[WizardStep.SelectReference].next(baseState, {
            needsReferenceFieldStep: false,
          })
        ).toBe(WizardStep.SelectFields);
      });

      it('SelectReferenceField → SelectFields', () => {
        expect(
          WIZARD_STEPS[WizardStep.SelectReferenceField].next(baseState, {
            needsReferenceFieldStep: true,
          })
        ).toBe(WizardStep.SelectFields);
      });

      it('SelectFields next() stays on SelectFields (terminal step)', () => {
        const state = makeState({ step: WizardStep.SelectFields });
        expect(
          WIZARD_STEPS[WizardStep.SelectFields].next(state, { needsReferenceFieldStep: true })
        ).toBe(WizardStep.SelectFields);
      });
    });

    describe('back() transitions', () => {
      it('ContentType back() stays on ContentType (no previous step)', () => {
        const state = makeState({ step: WizardStep.ContentType });
        expect(
          WIZARD_STEPS[WizardStep.ContentType].back(state, { needsReferenceFieldStep: true })
        ).toBe(WizardStep.ContentType);
      });

      it('IsReference → ContentType', () => {
        expect(
          WIZARD_STEPS[WizardStep.IsReference].back(baseState, { needsReferenceFieldStep: true })
        ).toBe(WizardStep.ContentType);
      });

      it('SelectReference → IsReference', () => {
        expect(
          WIZARD_STEPS[WizardStep.SelectReference].back(baseState, {
            needsReferenceFieldStep: true,
          })
        ).toBe(WizardStep.IsReference);
      });

      it('SelectReferenceField → SelectReference', () => {
        expect(
          WIZARD_STEPS[WizardStep.SelectReferenceField].back(baseState, {
            needsReferenceFieldStep: true,
          })
        ).toBe(WizardStep.SelectReference);
      });

      it('SelectFields → SelectReferenceField when isReference and needsReferenceFieldStep', () => {
        const state = makeState({ isReference: true });
        expect(
          WIZARD_STEPS[WizardStep.SelectFields].back(state, { needsReferenceFieldStep: true })
        ).toBe(WizardStep.SelectReferenceField);
      });

      it('SelectFields → SelectReference when isReference but not needsReferenceFieldStep', () => {
        const state = makeState({ isReference: true });
        expect(
          WIZARD_STEPS[WizardStep.SelectFields].back(state, { needsReferenceFieldStep: false })
        ).toBe(WizardStep.SelectReference);
      });

      it('SelectFields → IsReference when not isReference', () => {
        const state = makeState({ isReference: false });
        expect(
          WIZARD_STEPS[WizardStep.SelectFields].back(state, { needsReferenceFieldStep: false })
        ).toBe(WizardStep.IsReference);
      });
    });

    describe('isDisabled()', () => {
      it('ContentType is disabled when contentTypeId is empty', () => {
        expect(
          WIZARD_STEPS[WizardStep.ContentType].isDisabled(makeState({ contentTypeId: '' }))
        ).toBe(true);
      });

      it('ContentType is enabled when contentTypeId is set', () => {
        expect(
          WIZARD_STEPS[WizardStep.ContentType].isDisabled(makeState({ contentTypeId: 'article' }))
        ).toBe(false);
      });

      it('IsReference is disabled when isReference is null', () => {
        expect(
          WIZARD_STEPS[WizardStep.IsReference].isDisabled(makeState({ isReference: null }))
        ).toBe(true);
      });

      it('IsReference is enabled when isReference is set', () => {
        expect(
          WIZARD_STEPS[WizardStep.IsReference].isDisabled(makeState({ isReference: false }))
        ).toBe(false);
      });

      it('SelectReference is disabled when referenceEntryId is empty', () => {
        expect(
          WIZARD_STEPS[WizardStep.SelectReference].isDisabled(makeState({ referenceEntryId: '' }))
        ).toBe(true);
      });

      it('SelectReference is enabled when referenceEntryId is set', () => {
        expect(
          WIZARD_STEPS[WizardStep.SelectReference].isDisabled(
            makeState({ referenceEntryId: 'entry-1' })
          )
        ).toBe(false);
      });

      it('SelectReferenceField is disabled when referenceFieldId is empty', () => {
        expect(
          WIZARD_STEPS[WizardStep.SelectReferenceField].isDisabled(
            makeState({ referenceFieldId: '' })
          )
        ).toBe(true);
      });

      it('SelectReferenceField is enabled when referenceFieldId is set', () => {
        expect(
          WIZARD_STEPS[WizardStep.SelectReferenceField].isDisabled(
            makeState({ referenceFieldId: 'author' })
          )
        ).toBe(false);
      });

      it('SelectFields is never disabled', () => {
        expect(WIZARD_STEPS[WizardStep.SelectFields].isDisabled(makeState())).toBe(false);
      });
    });
  });

  describe('needsReferenceFieldStep = false path', () => {
    it('skips SelectReferenceField when navigating forward from SelectReference', () => {
      expect(
        WIZARD_STEPS[WizardStep.SelectReference].next(makeState(), {
          needsReferenceFieldStep: false,
        })
      ).toBe(WizardStep.SelectFields);
    });

    it('skips SelectReferenceField when navigating back from SelectFields with isReference', () => {
      const state = makeState({ isReference: true });
      expect(
        WIZARD_STEPS[WizardStep.SelectFields].back(state, { needsReferenceFieldStep: false })
      ).toBe(WizardStep.SelectReference);
    });
  });
});
