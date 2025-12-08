/**
 * ActionEditor Component
 *
 * Allows users to configure a single action (show/hide fields, or set options for reference fields)
 */

import React, { useState, useEffect } from 'react';
import {
  FormControl,
  Select,
  IconButton,
  Stack,
  Pill,
  Flex,
  Button,
  Modal,
  Checkbox,
  Text,
  Spinner,
  Note,
} from '@contentful/f36-components';
import { DeleteIcon, PlusIcon } from '@contentful/f36-icons';
import { Action, ActionType, FieldType } from '../../types/rules';
import { useCMA } from '@contentful/react-apps-toolkit';

interface ActionEditorProps {
  /** The action being edited */
  action: Action;
  /** Available fields from the content type */
  availableFields: Array<{
    id: string;
    name: string;
    type: FieldType;
    validations?: any[];
    items?: any;
  }>;
  /** Callback when action changes */
  onChange: (action: Action) => void;
  /** Callback when delete is requested */
  onDelete: () => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

interface Entry {
  sys: { id: string };
  fields: Record<string, any>;
}

export const ActionEditor: React.FC<ActionEditorProps> = ({
  action,
  availableFields,
  onChange,
  onDelete,
  disabled = false,
}) => {
  const cma = useCMA();
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<Set<string>>(new Set(action.fieldIds));
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(
    new Set(action.allowedEntries || [])
  );
  const [entries, setEntries] = useState<Entry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(false);
  const [entriesError, setEntriesError] = useState<string | null>(null);

  // Check if action type is SET_OPTIONS
  const isSetOptionsAction = action.type === ActionType.SET_OPTIONS;

  // Get reference fields only
  const referenceFields = availableFields.filter(
    (field) => field.type === 'Link' || field.type === 'Array'
  );

  // Get the selected reference field
  const selectedReferenceField =
    isSetOptionsAction && action.fieldIds.length > 0
      ? availableFields.find((f) => f.id === action.fieldIds[0])
      : null;

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as ActionType;

    // Clear fieldIds and allowedEntries when switching types
    const resetAction: Action = {
      ...action,
      type,
      fieldIds: [],
      allowedEntries: undefined,
    };

    onChange(resetAction);
  };

  const handleRemoveField = (fieldId: string) => {
    const newFieldIds = action.fieldIds.filter((id) => id !== fieldId);
    onChange({
      ...action,
      fieldIds: newFieldIds,
      // Clear allowed entries if removing the reference field
      allowedEntries: newFieldIds.length === 0 ? undefined : action.allowedEntries,
    });
  };

  const handleOpenFieldModal = () => {
    setSelectedFieldIds(new Set(action.fieldIds));
    setIsFieldModalOpen(true);
  };

  const handleToggleField = (fieldId: string) => {
    if (isSetOptionsAction) {
      // For SET_OPTIONS, only allow one field at a time
      setSelectedFieldIds(new Set([fieldId]));
    } else {
      // For SHOW/HIDE, allow multiple fields
      const newSelection = new Set(selectedFieldIds);
      if (newSelection.has(fieldId)) {
        newSelection.delete(fieldId);
      } else {
        newSelection.add(fieldId);
      }
      setSelectedFieldIds(newSelection);
    }
  };

  const handleSaveFieldSelection = () => {
    const newFieldIds = Array.from(selectedFieldIds);
    onChange({
      ...action,
      fieldIds: newFieldIds,
      // Clear allowed entries if field changed
      allowedEntries: newFieldIds[0] !== action.fieldIds[0] ? [] : action.allowedEntries,
    });
    setIsFieldModalOpen(false);
  };

  const handleOpenEntryModal = async () => {
    if (!selectedReferenceField) return;

    setIsEntryModalOpen(true);
    setIsLoadingEntries(true);
    setEntriesError(null);

    try {
      // Debug: Log the field structure
      console.log('[ActionEditor] Selected reference field:', selectedReferenceField);
      console.log('[ActionEditor] Field validations:', selectedReferenceField.validations);
      console.log('[ActionEditor] Field items:', selectedReferenceField.items);

      // Get the referenced content type ID from field validations
      // For Link fields: validations are on the field itself
      // For Array fields: validations are on field.items
      let linkContentTypeValidation;

      if (selectedReferenceField.type === 'Link') {
        console.log('[ActionEditor] Link field - checking field.validations');
        linkContentTypeValidation = selectedReferenceField.validations?.find(
          (v: any) => v.linkContentType
        );
      } else if (selectedReferenceField.type === 'Array' && selectedReferenceField.items) {
        console.log('[ActionEditor] Array field - checking field.items.validations');
        linkContentTypeValidation = selectedReferenceField.items.validations?.find(
          (v: any) => v.linkContentType
        );
      }

      console.log('[ActionEditor] Found linkContentTypeValidation:', linkContentTypeValidation);

      // Fetch entries for all allowed content types
      const allEntries: Entry[] = [];

      if (linkContentTypeValidation && linkContentTypeValidation.linkContentType) {
        // If there's a linkContentType validation, fetch only from those content types
        const contentTypeIds = linkContentTypeValidation.linkContentType;
        console.log('[ActionEditor] Fetching entries for specific content types:', contentTypeIds);

        for (const contentTypeId of contentTypeIds) {
          const response = await cma.entry.getMany({
            query: {
              content_type: contentTypeId,
              limit: 1000,
            },
          });
          allEntries.push(...response.items);
        }
      } else {
        // No specific content type validation - fetch ALL entries
        console.log('[ActionEditor] No linkContentType validation found - fetching all entries');
        const response = await cma.entry.getMany({
          query: {
            limit: 1000,
          },
        });
        allEntries.push(...response.items);
      }

      console.log('[ActionEditor] Fetched entries:', allEntries.length);
      setEntries(allEntries);
      setSelectedEntryIds(new Set(action.allowedEntries || []));
    } catch (error) {
      console.error('[ActionEditor] Error fetching entries:', error);
      setEntriesError('Failed to fetch entries. Please try again.');
    } finally {
      setIsLoadingEntries(false);
    }
  };

  const handleToggleEntry = (entryId: string) => {
    const newSelection = new Set(selectedEntryIds);
    if (newSelection.has(entryId)) {
      newSelection.delete(entryId);
    } else {
      newSelection.add(entryId);
    }
    setSelectedEntryIds(newSelection);
  };

  const handleSaveEntrySelection = () => {
    onChange({
      ...action,
      allowedEntries: Array.from(selectedEntryIds),
    });
    setIsEntryModalOpen(false);
  };

  const handleRemoveEntry = (entryId: string) => {
    const newAllowedEntries = (action.allowedEntries || []).filter((id) => id !== entryId);
    onChange({
      ...action,
      allowedEntries: newAllowedEntries,
    });
  };

  const getFieldName = (fieldId: string) => {
    const field = availableFields.find((f) => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  const getEntryTitle = (entryId: string) => {
    const entry = entries.find((e) => e.sys.id === entryId);
    if (!entry) return entryId;

    // Try to find a title field
    const titleField = entry.fields.title || entry.fields.name || entry.fields.displayName;
    if (titleField) {
      const firstLocale = Object.keys(titleField)[0];
      return titleField[firstLocale] || entryId;
    }

    return entryId;
  };

  return (
    <>
      <Flex alignItems="flex-end" gap="spacingS">
        <FormControl isRequired style={{ flex: '0 0 150px' }} marginBottom="none">
          <FormControl.Label>Action</FormControl.Label>
          <Select value={action.type} onChange={handleTypeChange} isDisabled={disabled}>
            <Select.Option value={ActionType.SHOW}>Show</Select.Option>
            <Select.Option value={ActionType.HIDE}>Hide</Select.Option>
            <Select.Option value={ActionType.SET_OPTIONS}>Set Options</Select.Option>
          </Select>
        </FormControl>

        <FormControl isRequired style={{ flex: 1 }} marginBottom="none">
          <FormControl.Label>{isSetOptionsAction ? 'Reference Field' : 'Fields'}</FormControl.Label>
          {isSetOptionsAction ? (
            // For SET_OPTIONS, use a dropdown for single-select
            <Select
              value={action.fieldIds[0] || ''}
              onChange={(e) => {
                const fieldId = e.target.value;
                onChange({
                  ...action,
                  fieldIds: fieldId ? [fieldId] : [],
                  // Clear allowed entries if field changed
                  allowedEntries: fieldId !== action.fieldIds[0] ? [] : action.allowedEntries,
                });
              }}
              isDisabled={disabled}>
              <Select.Option value="">Select a reference field</Select.Option>
              {referenceFields.map((field) => (
                <Select.Option key={field.id} value={field.id}>
                  {field.name} ({field.type})
                </Select.Option>
              ))}
            </Select>
          ) : (
            // For SHOW/HIDE, keep the existing multi-select UI
            <Flex flexDirection="column" gap="spacingXs" style={{ width: '100%' }}>
              {action.fieldIds.length > 0 && (
                <Flex flexWrap="wrap" gap="spacingXs">
                  {action.fieldIds.map((fieldId) => (
                    <Pill
                      key={fieldId}
                      label={getFieldName(fieldId)}
                      onClose={() => handleRemoveField(fieldId)}
                      onDrag={undefined}
                    />
                  ))}
                </Flex>
              )}
              <Button
                variant="secondary"
                startIcon={<PlusIcon />}
                onClick={handleOpenFieldModal}
                isDisabled={disabled}>
                {action.fieldIds.length === 0 ? 'Select Fields' : 'Edit Fields'}
              </Button>
            </Flex>
          )}
        </FormControl>

        {isSetOptionsAction && action.fieldIds.length > 0 && (
          <FormControl style={{ flex: 1 }}>
            <FormControl.Label>Allowed Entries</FormControl.Label>
            <Flex flexDirection="column" gap="spacingXs" style={{ width: '100%' }}>
              {action.allowedEntries && action.allowedEntries.length > 0 && (
                <Flex flexWrap="wrap" gap="spacingXs">
                  {action.allowedEntries.map((entryId) => (
                    <Pill
                      key={entryId}
                      label={getEntryTitle(entryId)}
                      onClose={() => handleRemoveEntry(entryId)}
                      onDrag={undefined}
                    />
                  ))}
                </Flex>
              )}
              <Button
                variant="secondary"
                size="small"
                startIcon={<PlusIcon />}
                onClick={handleOpenEntryModal}
                isDisabled={disabled}>
                {!action.allowedEntries || action.allowedEntries.length === 0
                  ? 'Select Entries'
                  : 'Edit Entries'}
              </Button>
            </Flex>
          </FormControl>
        )}

        <IconButton
          variant="transparent"
          icon={<DeleteIcon />}
          aria-label="Delete action"
          onClick={onDelete}
          isDisabled={disabled}
        />
      </Flex>

      {/* Field Selection Modal (only for SHOW/HIDE actions) */}
      {!isSetOptionsAction && (
        <Modal onClose={() => setIsFieldModalOpen(false)} isShown={isFieldModalOpen}>
          {() => (
            <>
              <Modal.Header title="Select Fields" onClose={() => setIsFieldModalOpen(false)} />
              <Modal.Content>
                <Stack flexDirection="column" spacing="spacingS">
                  <Text>
                    Select the fields that should be{' '}
                    {action.type === ActionType.SHOW ? 'shown' : 'hidden'}:
                  </Text>
                  {availableFields.map((field) => (
                    <Checkbox
                      key={field.id}
                      id={`field-${field.id}`}
                      isChecked={selectedFieldIds.has(field.id)}
                      onChange={() => handleToggleField(field.id)}>
                      {field.name} ({field.type})
                    </Checkbox>
                  ))}
                </Stack>
              </Modal.Content>
              <Modal.Controls>
                <Button variant="transparent" onClick={() => setIsFieldModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="positive"
                  onClick={handleSaveFieldSelection}
                  isDisabled={selectedFieldIds.size === 0}>
                  Save Selection
                </Button>
              </Modal.Controls>
            </>
          )}
        </Modal>
      )}

      {/* Entry Selection Modal (for SET_OPTIONS action) */}
      <Modal onClose={() => setIsEntryModalOpen(false)} isShown={isEntryModalOpen} size="large">
        {() => (
          <>
            <Modal.Header
              title="Select Allowed Entries"
              onClose={() => setIsEntryModalOpen(false)}
            />
            <Modal.Content>
              <Stack flexDirection="column" spacing="spacingS">
                <Text>
                  Select the entries that editors will be allowed to choose from for this reference
                  field:
                </Text>
                {isLoadingEntries ? (
                  <Flex justifyContent="center" padding="spacingL">
                    <Spinner />
                  </Flex>
                ) : entriesError ? (
                  <Note variant="negative">{entriesError}</Note>
                ) : entries.length === 0 ? (
                  <Note variant="warning">No entries found for this reference type.</Note>
                ) : (
                  <Stack
                    flexDirection="column"
                    spacing="spacingXs"
                    style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {entries.map((entry) => (
                      <Checkbox
                        key={entry.sys.id}
                        id={`entry-${entry.sys.id}`}
                        isChecked={selectedEntryIds.has(entry.sys.id)}
                        onChange={() => handleToggleEntry(entry.sys.id)}>
                        {getEntryTitle(entry.sys.id)}
                      </Checkbox>
                    ))}
                  </Stack>
                )}
              </Stack>
            </Modal.Content>
            <Modal.Controls>
              <Button variant="transparent" onClick={() => setIsEntryModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="positive"
                onClick={handleSaveEntrySelection}
                isDisabled={isLoadingEntries || selectedEntryIds.size === 0}>
                Save Selection
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </>
  );
};
