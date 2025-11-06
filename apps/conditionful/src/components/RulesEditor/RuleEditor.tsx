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
  Card,
  Heading,
  Text,
  Box,
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
  availableFields: Array<{ id: string; name: string; type: FieldType }>;
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
    <Card padding="large">
      <Stack flexDirection="column" spacing="spacingL">
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
            backgroundColor: '#d3dce0',
            margin: '0 -24px',
          }}
        />

        {/* Conditions Section */}
        <Stack flexDirection="column" spacing="spacingM">
          <Stack flexDirection="row" alignItems="center" spacing="spacingS">
            <Heading as="h3" marginBottom="none">
              If
            </Heading>
            <Select
              value={rule.matchMode}
              onChange={handleMatchModeChange}
              isDisabled={disabled}
              style={{ width: 'auto' }}
            >
              <Select.Option value={MatchMode.ALL}>All</Select.Option>
              <Select.Option value={MatchMode.ANY}>Any</Select.Option>
            </Select>
            <Text>of the following conditions are met:</Text>
          </Stack>

          {rule.conditions.length === 0 && (
            <Text fontColor="gray500">No conditions added yet</Text>
          )}

          {rule.conditions.map((condition, index) => (
            <ConditionEditor
              key={condition.id}
              condition={condition}
              availableFields={availableFields}
              onChange={(updated) => handleConditionChange(index, updated)}
              onDelete={() => handleDeleteCondition(index)}
              disabled={disabled}
            />
          ))}

          <Button
            variant="secondary"
            size="small"
            startIcon={<PlusIcon />}
            onClick={handleAddCondition}
            isDisabled={disabled}
          >
            Add Condition
          </Button>
        </Stack>

        <Box
          style={{
            height: '1px',
            backgroundColor: '#d3dce0',
            margin: '0 -24px',
          }}
        />

        {/* Actions Section */}
        <Stack flexDirection="column" spacing="spacingM">
          <Heading as="h3">Perform the following actions:</Heading>

          {rule.actions.length === 0 && (
            <Text fontColor="gray500">No actions added yet</Text>
          )}

          {rule.actions.map((action, index) => (
            <ActionEditor
              key={action.id}
              action={action}
              availableFields={availableFields}
              onChange={(updated) => handleActionChange(index, updated)}
              onDelete={() => handleDeleteAction(index)}
              disabled={disabled}
            />
          ))}

          <Button
            variant="secondary"
            size="small"
            startIcon={<PlusIcon />}
            onClick={handleAddAction}
            isDisabled={disabled}
          >
            Add Action
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
};

