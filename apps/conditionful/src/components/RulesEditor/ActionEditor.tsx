/**
 * ActionEditor Component
 * 
 * Allows users to configure a single action (show/hide fields)
 */

import React, { useState } from 'react';
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
} from '@contentful/f36-components';
import { DeleteIcon, PlusIcon } from '@contentful/f36-icons';
import { Action, ActionType, FieldType } from '../../types/rules';

interface ActionEditorProps {
  /** The action being edited */
  action: Action;
  /** Available fields from the content type */
  availableFields: Array<{ id: string; name: string; type: FieldType }>;
  /** Callback when action changes */
  onChange: (action: Action) => void;
  /** Callback when delete is requested */
  onDelete: () => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

export const ActionEditor: React.FC<ActionEditorProps> = ({
  action,
  availableFields,
  onChange,
  onDelete,
  disabled = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFieldIds, setSelectedFieldIds] = useState<Set<string>>(
    new Set(action.fieldIds)
  );

  const handleTypeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const type = event.target.value as ActionType;
    onChange({
      ...action,
      type,
    });
  };

  const handleRemoveField = (fieldId: string) => {
    const newFieldIds = action.fieldIds.filter((id) => id !== fieldId);
    onChange({
      ...action,
      fieldIds: newFieldIds,
    });
  };

  const handleOpenModal = () => {
    setSelectedFieldIds(new Set(action.fieldIds));
    setIsModalOpen(true);
  };

  const handleToggleField = (fieldId: string) => {
    const newSelection = new Set(selectedFieldIds);
    if (newSelection.has(fieldId)) {
      newSelection.delete(fieldId);
    } else {
      newSelection.add(fieldId);
    }
    setSelectedFieldIds(newSelection);
  };

  const handleSaveSelection = () => {
    onChange({
      ...action,
      fieldIds: Array.from(selectedFieldIds),
    });
    setIsModalOpen(false);
  };

  const getFieldName = (fieldId: string) => {
    const field = availableFields.find((f) => f.id === fieldId);
    return field ? field.name : fieldId;
  };

  return (
    <>
      <Stack flexDirection="row" alignItems="flex-start" spacing="spacingS">
        <FormControl isRequired style={{ flex: '0 0 150px' }}>
          <FormControl.Label>Show or Hide</FormControl.Label>
          <Select
            value={action.type}
            onChange={handleTypeChange}
            isDisabled={disabled}
          >
            <Select.Option value={ActionType.SHOW}>Show</Select.Option>
            <Select.Option value={ActionType.HIDE}>Hide</Select.Option>
          </Select>
        </FormControl>

        <FormControl isRequired style={{ flex: 1 }}>
          <FormControl.Label>Field (required)</FormControl.Label>
          <Flex flexDirection="column" gap="spacingS">
            <Flex flexWrap="wrap" gap="spacingXs">
              {action.fieldIds.length === 0 && (
                <Text fontColor="gray500" fontSize="fontSizeM">
                  No fields selected
                </Text>
              )}
              {action.fieldIds.map((fieldId) => (
                <Pill
                  key={fieldId}
                  label={getFieldName(fieldId)}
                  onClose={() => handleRemoveField(fieldId)}
                  onDrag={undefined}
                />
              ))}
            </Flex>
            <Button
              variant="secondary"
              size="small"
              startIcon={<PlusIcon />}
              onClick={handleOpenModal}
              isDisabled={disabled}
            >
              Select Fields
            </Button>
          </Flex>
        </FormControl>

        <IconButton
          variant="transparent"
          icon={<DeleteIcon />}
          aria-label="Delete action"
          onClick={onDelete}
          isDisabled={disabled}
          size="small"
          style={{ marginTop: '28px' }}
        />
      </Stack>

      <Modal onClose={() => setIsModalOpen(false)} isShown={isModalOpen}>
        {() => (
          <>
            <Modal.Header
              title="Select Fields"
              onClose={() => setIsModalOpen(false)}
            />
            <Modal.Content>
              <Stack flexDirection="column" spacing="spacingS">
                <Text>
                  Select the fields that should be {action.type === ActionType.SHOW ? 'shown' : 'hidden'}:
                </Text>
                {availableFields.map((field) => (
                  <Checkbox
                    key={field.id}
                    id={`field-${field.id}`}
                    isChecked={selectedFieldIds.has(field.id)}
                    onChange={() => handleToggleField(field.id)}
                  >
                    {field.name} ({field.type})
                  </Checkbox>
                ))}
              </Stack>
            </Modal.Content>
            <Modal.Controls>
              <Button
                variant="transparent"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="positive"
                onClick={handleSaveSelection}
              >
                Save Selection
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </>
  );
};

