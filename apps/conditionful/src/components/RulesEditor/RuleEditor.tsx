/**
 * RuleEditor Component
 *
 * Form to edit a complete rule including name, match mode, conditions, and actions
 */

import React from 'react';
import {
  FormControl,
  TextInput,
  Select,
  Button,
  Stack,
  Text,
  Box,
  Flex,
} from '@contentful/f36-components';
import { PlusIcon } from '@contentful/f36-icons';
import { Rule, Condition, Action, MatchMode, ActionType, FieldType } from '../../types/rules';
import { ConditionEditor } from './ConditionEditor';
import { ActionEditor } from './ActionEditor';
import { TextOperator } from '../../types/rules';

interface RuleEditorProps {
  /** The rule being edited */
  rule: Rule;
  /** Available fields from the content type */
  availableFields: Array<{
    id: string;
    name: string;
    type: FieldType;
    validations?: any[];
    items?: any;
  }>;
  /** Callback when rule changes */
  onChange: (rule: Rule) => void;
  /** Whether the editor is disabled */
  disabled?: boolean;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({
  rule,
  availableFields,
  onChange,
  disabled = false,
}) => {
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange({
      ...rule,
      name: event.target.value,
    });
  };

  const handleMatchModeChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({
      ...rule,
      matchMode: event.target.value as MatchMode,
    });
  };

  const handleAddCondition = () => {
    const newCondition: Condition = {
      id: `condition-${Date.now()}-${Math.random()}`,
      fieldId: '',
      fieldType: 'Symbol',
      operator: TextOperator.EQUALS,
      value: undefined,
    };

    onChange({
      ...rule,
      conditions: [...rule.conditions, newCondition],
    });
  };

  const handleConditionChange = (index: number, updatedCondition: Condition) => {
    const newConditions = [...rule.conditions];
    newConditions[index] = updatedCondition;
    onChange({
      ...rule,
      conditions: newConditions,
    });
  };

  const handleDeleteCondition = (index: number) => {
    const newConditions = rule.conditions.filter((_, i) => i !== index);
    onChange({
      ...rule,
      conditions: newConditions,
    });
  };

  const handleAddAction = () => {
    const newAction: Action = {
      id: `action-${Date.now()}-${Math.random()}`,
      type: ActionType.HIDE,
      fieldIds: [],
    };

    onChange({
      ...rule,
      actions: [...rule.actions, newAction],
    });
  };

  const handleActionChange = (index: number, updatedAction: Action) => {
    const newActions = [...rule.actions];
    newActions[index] = updatedAction;
    onChange({
      ...rule,
      actions: newActions,
    });
  };

  const handleDeleteAction = (index: number) => {
    const newActions = rule.actions.filter((_, i) => i !== index);
    onChange({
      ...rule,
      actions: newActions,
    });
  };

  return (
    <Stack flexDirection="column" alignItems="stretch" spacing="spacingM" style={{ width: '100%' }}>
      {/* Rule Name */}
      <FormControl isRequired>
        <FormControl.Label>Rule Name</FormControl.Label>
        <TextInput
          value={rule.name}
          onChange={handleNameChange}
          placeholder="Enter rule name"
          isDisabled={disabled}
        />
      </FormControl>

      <Box
        style={{
          height: '1px',
          backgroundColor: '#e5ebed',
          margin: '0',
        }}
      />

      {/* Conditions Section */}
      <Stack flexDirection="column" spacing="spacingM" alignItems="stretch">
        <Flex alignItems="center" gap="spacingS">
          <Text fontWeight="fontWeightMedium" fontSize="fontSizeL">
            If
          </Text>
          <Select
            value={rule.matchMode}
            onChange={handleMatchModeChange}
            isDisabled={disabled}
            size="small"
            style={{ width: '80px' }}>
            <Select.Option value={MatchMode.ALL}>All</Select.Option>
            <Select.Option value={MatchMode.ANY}>Any</Select.Option>
          </Select>
          <Text fontColor="gray700">of the following conditions are met:</Text>
        </Flex>

        {rule.conditions.map((condition, index) => (
          <React.Fragment key={condition.id}>
            {index > 0 && rule.conditions.length > 1 && (
              <Flex alignItems="center" justifyContent="flex-start" style={{ height: '12px' }}>
                <Flex flexDirection="column" alignItems="center" style={{ width: '28px' }}>
                  <Box
                    style={{
                      width: '2px',
                      height: '24px',
                      backgroundColor: '#d3dce0',
                    }}
                  />
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      border: '2px solid #d3dce0',
                      color: '#7f8c95',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}>
                    &
                  </Flex>
                  <Box
                    style={{
                      width: '2px',
                      height: '24px',
                      backgroundColor: '#d3dce0',
                    }}
                  />
                </Flex>
              </Flex>
            )}
            <Flex marginLeft="spacingXl">
              <ConditionEditor
                condition={condition}
                availableFields={availableFields}
                onChange={(updated) => handleConditionChange(index, updated)}
                onDelete={() => handleDeleteCondition(index)}
                disabled={disabled}
              />
            </Flex>
          </React.Fragment>
        ))}

        <Button
          variant="secondary"
          size="small"
          startIcon={<PlusIcon />}
          onClick={handleAddCondition}
          isDisabled={disabled}
          style={{ alignSelf: 'center' }}>
          Add Condition
        </Button>
      </Stack>

      <Box
        style={{
          height: '1px',
          backgroundColor: '#e5ebed',
          margin: '0',
        }}
      />

      {/* Actions Section */}
      <Stack flexDirection="column" spacing="spacingM" alignItems="stretch">
        <Text fontWeight="fontWeightMedium" fontSize="fontSizeL">
          Perform the following actions:
        </Text>

        {rule.actions.map((action, index) => (
          <React.Fragment key={action.id}>
            {index > 0 && rule.actions.length > 1 && (
              <Flex alignItems="center" justifyContent="flex-start" style={{ height: '12px' }}>
                <Flex flexDirection="column" alignItems="center" style={{ width: '28px' }}>
                  <Box
                    style={{
                      width: '2px',
                      height: '24px',
                      backgroundColor: '#d3dce0',
                    }}
                  />
                  <Flex
                    justifyContent="center"
                    alignItems="center"
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#fff',
                      border: '2px solid #d3dce0',
                      color: '#7f8c95',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}>
                    &
                  </Flex>
                  <Box
                    style={{
                      width: '2px',
                      height: '24px',
                      backgroundColor: '#d3dce0',
                    }}
                  />
                </Flex>
              </Flex>
            )}
            <Flex marginLeft="spacingXl">
              <ActionEditor
                action={action}
                availableFields={availableFields}
                onChange={(updated) => handleActionChange(index, updated)}
                onDelete={() => handleDeleteAction(index)}
                disabled={disabled}
              />
            </Flex>
          </React.Fragment>
        ))}

        <Button
          variant="secondary"
          size="small"
          startIcon={<PlusIcon />}
          onClick={handleAddAction}
          isDisabled={disabled}
          style={{ alignSelf: 'center' }}>
          Add Action
        </Button>
      </Stack>
    </Stack>
  );
};
