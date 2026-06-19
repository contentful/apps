import { FormControl, Flex, Radio, Select, Text } from '@contentful/f36-components';
import type { EditModalNewLocation, EditModalFieldOption, WorkflowContentType } from '@types';
import { FieldSelectionDropdown } from './FieldSelectionDropdown';

export enum WizardStep {
  ContentType = 'content-type',
  IsReference = 'is-reference',
  SelectReference = 'select-reference',
  SelectReferenceField = 'select-reference-field',
  SelectFields = 'select-fields',
}

export interface Wizard {
  step: WizardStep;
  contentTypeId: string;
  isReference: boolean | null;
  referenceEntryId: string;
  referenceFieldId: string;
  selectedFieldIds: string[];
}

export const INITIAL_WIZARD_STATE: Wizard = {
  step: WizardStep.ContentType,
  contentTypeId: '',
  isReference: null,
  referenceEntryId: '',
  referenceFieldId: '',
  selectedFieldIds: [],
};

export interface ExistingEntryOption {
  tempId: string;
  label: string;
}

interface WizardCtx {
  needsReferenceFieldStep: boolean;
}

interface StepDescriptor {
  next(state: Wizard, ctx: WizardCtx): WizardStep;
  back(state: Wizard, ctx: WizardCtx): WizardStep;
  isDisabled(state: Wizard): boolean;
}

export const WIZARD_STEPS: Record<WizardStep, StepDescriptor> = {
  [WizardStep.ContentType]: {
    next: () => WizardStep.IsReference,
    back: (s) => s.step,
    isDisabled: (s) => !s.contentTypeId,
  },
  [WizardStep.IsReference]: {
    next: (s) => (s.isReference ? WizardStep.SelectReference : WizardStep.SelectFields),
    back: () => WizardStep.ContentType,
    isDisabled: (s) => s.isReference === null,
  },
  [WizardStep.SelectReference]: {
    next: (_, ctx) =>
      ctx.needsReferenceFieldStep ? WizardStep.SelectReferenceField : WizardStep.SelectFields,
    back: () => WizardStep.IsReference,
    isDisabled: (s) => !s.referenceEntryId,
  },
  [WizardStep.SelectReferenceField]: {
    next: () => WizardStep.SelectFields,
    back: () => WizardStep.SelectReference,
    isDisabled: (s) => !s.referenceFieldId,
  },
  [WizardStep.SelectFields]: {
    next: (s) => s.step,
    back: (s, ctx) =>
      s.isReference
        ? ctx.needsReferenceFieldStep
          ? WizardStep.SelectReferenceField
          : WizardStep.SelectReference
        : WizardStep.IsReference,
    isDisabled: () => false,
  },
};

interface AddEntryWizardProps {
  state: Wizard;
  onChange: (next: Partial<Wizard>) => void;
  contentTypes: WorkflowContentType[];
  existingEntries: ExistingEntryOption[];
  referenceFieldOptions: EditModalFieldOption[];
  selectedText: string;
  isImageContent: boolean;
  buildNewLocation: (contentTypeId: string) => EditModalNewLocation;
}

export const AddEntryWizard = ({
  state,
  onChange,
  contentTypes,
  existingEntries,
  referenceFieldOptions,
  selectedText,
  isImageContent,
  buildNewLocation,
}: AddEntryWizardProps) => {
  const newLocation = state.contentTypeId ? buildNewLocation(state.contentTypeId) : null;

  const renderStep = () => {
    switch (state.step) {
      case WizardStep.ContentType:
        return (
          <FormControl marginBottom="none">
            <FormControl.Label>Select content type</FormControl.Label>
            <Select
              value={state.contentTypeId}
              onChange={(e) => onChange({ contentTypeId: e.target.value })}>
              <Select.Option value="" isDisabled>
                Select a content type
              </Select.Option>
              {contentTypes.map((ct) => (
                <Select.Option key={ct.sys.id} value={ct.sys.id}>
                  {ct.name ?? ct.sys.id}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        );
      case WizardStep.IsReference:
        return (
          <FormControl marginBottom="none">
            <FormControl.Label>Should this entry be a reference entry?</FormControl.Label>
            <Flex flexDirection="column" gap="spacingXs">
              <Radio
                id="ref-yes"
                name="is-reference"
                value="yes"
                isChecked={state.isReference === true}
                onChange={() => onChange({ isReference: true })}>
                Yes
              </Radio>
              <Radio
                id="ref-no"
                name="is-reference"
                value="no"
                isChecked={state.isReference === false}
                onChange={() => onChange({ isReference: false })}>
                No
              </Radio>
            </Flex>
          </FormControl>
        );
      case WizardStep.SelectReference:
        return (
          <FormControl marginBottom="none">
            <FormControl.Label>Select entry it should be a reference to</FormControl.Label>
            <Select
              value={state.referenceEntryId}
              onChange={(e) => onChange({ referenceEntryId: e.target.value })}>
              <Select.Option value="" isDisabled>
                Select an entry
              </Select.Option>
              {existingEntries.map((entry) => (
                <Select.Option key={entry.tempId} value={entry.tempId}>
                  {entry.label}
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        );
      case WizardStep.SelectReferenceField:
        return (
          <FormControl marginBottom="none">
            <FormControl.Label>Which field should connect to this reference?</FormControl.Label>
            <Select
              value={state.referenceFieldId}
              onChange={(e) => onChange({ referenceFieldId: e.target.value })}>
              <Select.Option value="" isDisabled>
                Select a field
              </Select.Option>
              {referenceFieldOptions.map((field) => (
                <Select.Option key={field.id} value={field.id}>
                  {field.fieldName} ({field.fieldDisplayType})
                </Select.Option>
              ))}
            </Select>
          </FormControl>
        );
      case WizardStep.SelectFields:
        return newLocation ? (
          <FormControl marginBottom="none">
            <FormControl.Label>Select the field(s) the content should map to</FormControl.Label>
            <FieldSelectionDropdown
              selectedText={selectedText}
              isImageContent={isImageContent}
              fieldOptions={newLocation.fieldOptions}
              fieldMappings={newLocation.fieldMappings}
              selectedFieldIds={state.selectedFieldIds}
              onSelectedFieldIdsChange={(updater) =>
                onChange({ selectedFieldIds: updater(state.selectedFieldIds) })
              }
            />
          </FormControl>
        ) : null;
    }
  };

  return (
    <Flex flexDirection="column" gap="spacingS">
      <Text as="p" fontWeight="fontWeightDemiBold">
        Add entry
      </Text>
      {renderStep()}
    </Flex>
  );
};
