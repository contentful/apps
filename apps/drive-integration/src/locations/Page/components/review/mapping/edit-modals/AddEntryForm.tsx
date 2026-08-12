import { useMemo } from 'react';
import { FormControl, Flex, Radio, Select, Text } from '@contentful/f36-components';
import type { AddEntryFormParams, EditModalFieldOption, WorkflowContentType } from '@types';
import { buildFieldOptionsForContentType, isEntryReferenceField } from '../fieldFormatting';
import { FieldSelectionDropdown } from './FieldSelectionDropdown';

export interface AddEntryFormState {
  contentTypeId: string;
  isReference: boolean | null;
  /** Parent entry tempId when linking as a child reference. */
  referenceEntryId: string;
  /** Reference field on the parent content type. */
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
  contentTypeId: string;
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

const getParentContentTypeId = (
  state: AddEntryFormState,
  existingEntries: ExistingEntryOption[]
): string =>
  existingEntries.find((entry) => entry.tempId === state.referenceEntryId)?.contentTypeId ?? '';

/** Existing entries whose content type has at least one Entry reference field. */
export const getParentEntriesThatAcceptChildren = (
  contentTypes: WorkflowContentType[],
  existingEntries: ExistingEntryOption[]
): ExistingEntryOption[] =>
  existingEntries.filter(
    (entry) => getReferenceFieldOptions(contentTypes, entry.contentTypeId).length > 0
  );

/** True when at least one existing entry's content type can accept a child reference. */
export const canLinkAsChildReference = (
  contentTypes: WorkflowContentType[],
  existingEntries: ExistingEntryOption[]
): boolean => getParentEntriesThatAcceptChildren(contentTypes, existingEntries).length > 0;

/** Returns true when the form lacks enough input to save. */
export const isAddEntrySaveDisabled = (
  state: AddEntryFormState,
  contentTypes: WorkflowContentType[],
  existingEntries: ExistingEntryOption[] = []
): boolean => {
  if (!state.contentTypeId) return true;
  const canBeReference = canLinkAsChildReference(contentTypes, existingEntries);
  // Reference Yes/No is hidden when no parent can accept a child — treat as No.
  if (canBeReference && state.isReference === null) return true;
  if (state.isReference) {
    // Child link lives on the parent — require a parent, then its reference field when ambiguous.
    if (!state.referenceEntryId) return true;
    const parentContentTypeId = getParentContentTypeId(state, existingEntries);
    const referenceFieldOptions = getReferenceFieldOptions(contentTypes, parentContentTypeId);
    if (referenceFieldOptions.length === 0) return true;
    if (referenceFieldOptions.length > 1 && !state.referenceFieldId) return true;
  }
  return state.selectedFieldIds.length === 0;
};

/** Maps form state to the payload expected by onAddEntry. */
export const toAddEntryFormParams = (
  state: AddEntryFormState,
  contentTypes: WorkflowContentType[],
  existingEntries: ExistingEntryOption[] = []
): AddEntryFormParams => {
  const parentContentTypeId = getParentContentTypeId(state, existingEntries);
  const referenceFieldOptions = getReferenceFieldOptions(contentTypes, parentContentTypeId);
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
  const parentContentTypeId = useMemo(
    () =>
      existingEntries.find((entry) => entry.tempId === state.referenceEntryId)?.contentTypeId ?? '',
    [existingEntries, state.referenceEntryId]
  );
  const referenceFieldOptions = useMemo(
    () => getReferenceFieldOptions(contentTypes, parentContentTypeId),
    [contentTypes, parentContentTypeId]
  );
  const showReferenceFieldSelect =
    Boolean(state.referenceEntryId) && referenceFieldOptions.length > 1;
  const parentEntryOptions = useMemo(
    () => getParentEntriesThatAcceptChildren(contentTypes, existingEntries),
    [contentTypes, existingEntries]
  );
  const canBeReference = parentEntryOptions.length > 0;
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

  const handleParentEntryChange = (referenceEntryId: string) => {
    onChange({
      referenceEntryId,
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
          {canBeReference && (
            <FormControl marginBottom="none">
              <FormControl.Label>
                Should this new entry be a reference of an existing entry?
              </FormControl.Label>
              <Flex flexDirection="column" gap="spacingXs">
                <Radio
                  id="ref-yes"
                  name="is-reference"
                  value="yes"
                  isChecked={state.isReference === true}
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
          )}

          {canBeReference && state.isReference === true && (
            <FormControl marginBottom="none">
              <FormControl.Label>
                Which existing entry should this new entry be a reference to?
              </FormControl.Label>
              <Select
                value={state.referenceEntryId}
                onChange={(e) => handleParentEntryChange(e.target.value)}>
                <Select.Option value="" isDisabled>
                  Select an entry
                </Select.Option>
                {parentEntryOptions.map((entry) => (
                  <Select.Option key={entry.tempId} value={entry.tempId}>
                    {entry.label}
                  </Select.Option>
                ))}
              </Select>
            </FormControl>
          )}

          {canBeReference && state.isReference === true && showReferenceFieldSelect && (
            <FormControl marginBottom="none">
              <FormControl.Label>
                Which field on the parent should link to this entry?
              </FormControl.Label>
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
