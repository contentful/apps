import { useMemo } from 'react';
import { FormControl, Flex, Radio, Select, Text } from '@contentful/f36-components';
import type { AddEntryFormParams, EditModalFieldOption, WorkflowContentType } from '@types';
import { buildFieldOptionsForContentType, isEntryReferenceField } from '../fieldFormatting';
import { FieldSelectionDropdown } from './FieldSelectionDropdown';

export interface AddEntryFormState {
  contentTypeId: string;
  isReference: boolean | null;
  referenceEntryId: string;
  referenceFieldId: string;
  selectedFieldIds: string[];
}

export const INITIAL_ADD_ENTRY_FORM_STATE: AddEntryFormState = {
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

const getReferenceFieldOptions = (
  contentTypes: WorkflowContentType[],
  contentTypeId: string
): EditModalFieldOption[] => {
  const contentType = contentTypes.find((ct) => ct.sys.id === contentTypeId);
  if (!contentType) return [];
  const referenceFields = (contentType.fields ?? []).filter(isEntryReferenceField);
  return buildFieldOptionsForContentType({
    ...contentType,
    fields: referenceFields,
  });
};

/** Returns true when the form lacks enough input to save. */
export const isAddEntrySaveDisabled = (
  state: AddEntryFormState,
  contentTypes: WorkflowContentType[]
): boolean => {
  if (!state.contentTypeId) return true;
  if (state.isReference === null) return true;
  if (state.isReference) {
    const referenceFieldOptions = getReferenceFieldOptions(contentTypes, state.contentTypeId);
    if (referenceFieldOptions.length === 0) return true;
    if (!state.referenceEntryId) return true;
    if (referenceFieldOptions.length > 1 && !state.referenceFieldId) return true;
  }
  return state.selectedFieldIds.length === 0;
};

/** Maps form state to the payload expected by onAddEntry. */
export const toAddEntryFormParams = (
  state: AddEntryFormState,
  contentTypes: WorkflowContentType[]
): AddEntryFormParams => {
  const referenceFieldOptions = getReferenceFieldOptions(contentTypes, state.contentTypeId);
  return {
    contentTypeId: state.contentTypeId,
    isReference: state.isReference ?? false,
    referenceEntryId: state.isReference ? state.referenceEntryId || null : null,
    referenceFieldId: state.isReference
      ? state.referenceFieldId || referenceFieldOptions[0]?.id || null
      : null,
    fieldIds: state.selectedFieldIds,
  };
};

interface AddEntryFormProps {
  state: AddEntryFormState;
  onChange: (next: Partial<AddEntryFormState>) => void;
  contentTypes: WorkflowContentType[];
  existingEntries: ExistingEntryOption[];
  selectedText: string;
  isImageContent: boolean;
}

export const AddEntryForm = ({
  state,
  onChange,
  contentTypes,
  existingEntries,
  selectedText,
  isImageContent,
}: AddEntryFormProps) => {
  const selectedContentType = useMemo(
    () => contentTypes.find((ct) => ct.sys.id === state.contentTypeId),
    [contentTypes, state.contentTypeId]
  );
  const fieldOptions = useMemo(
    () => buildFieldOptionsForContentType(selectedContentType),
    [selectedContentType]
  );
  const referenceFieldOptions = useMemo(
    () => getReferenceFieldOptions(contentTypes, state.contentTypeId),
    [contentTypes, state.contentTypeId]
  );
  const showReferenceFieldSelect = referenceFieldOptions.length > 1;
  const canBeReference = referenceFieldOptions.length > 0;
  const hasContentType = Boolean(state.contentTypeId);

  const handleContentTypeChange = (contentTypeId: string) => {
    onChange({
      contentTypeId,
      isReference: null,
      referenceEntryId: '',
      referenceFieldId: '',
      selectedFieldIds: [],
    });
  };

  const handleReferenceChange = (isReference: boolean) => {
    if (isReference) {
      onChange({ isReference: true });
      return;
    }
    onChange({
      isReference: false,
      referenceEntryId: '',
      referenceFieldId: '',
    });
  };

  return (
    <Flex flexDirection="column" gap="spacingS">
      <Text as="p" fontWeight="fontWeightDemiBold">
        Add entry
      </Text>

      <FormControl marginBottom="none">
        <FormControl.Label>Select content type</FormControl.Label>
        <Select
          value={state.contentTypeId}
          onChange={(e) => handleContentTypeChange(e.target.value)}>
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

      {hasContentType && (
        <>
          <FormControl marginBottom="none">
            <FormControl.Label>Should this entry be a reference entry?</FormControl.Label>
            <Flex flexDirection="column" gap="spacingXs">
              <Radio
                id="ref-yes"
                name="is-reference"
                value="yes"
                isChecked={state.isReference === true}
                isDisabled={!canBeReference}
                onChange={() => handleReferenceChange(true)}>
                Yes
              </Radio>
              <Radio
                id="ref-no"
                name="is-reference"
                value="no"
                isChecked={state.isReference === false}
                onChange={() => handleReferenceChange(false)}>
                No
              </Radio>
            </Flex>
          </FormControl>

          {state.isReference === true && (
            <FormControl marginBottom="none">
              <FormControl.Label>Select the entry this should reference</FormControl.Label>
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
          )}

          {state.isReference === true && showReferenceFieldSelect && (
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
          )}

          <FormControl marginBottom="none">
            <FormControl.Label>Select the field(s) the content should map to</FormControl.Label>
            <FieldSelectionDropdown
              selectedText={selectedText}
              isImageContent={isImageContent}
              fieldOptions={fieldOptions}
              fieldMappings={[]}
              selectedFieldIds={state.selectedFieldIds}
              onSelectedFieldIdsChange={(updater) =>
                onChange({ selectedFieldIds: updater(state.selectedFieldIds) })
              }
            />
          </FormControl>
        </>
      )}
    </Flex>
  );
};
