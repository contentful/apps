/**
 * RulesPanel Component
 *
 * Main panel showing list of rules with enable/disable toggles and management options
 */

import React, { useState } from 'react';
import {
  Header,
  Stack,
  Button,
  Card,
  Switch,
  Flex,
  IconButton,
  Text,
  Badge,
  Modal,
  Note,
  Box,
} from '@contentful/f36-components';
import tokens from '@contentful/f36-tokens';
import { PlusIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import { Rule, MatchMode, FieldType } from '../../types/rules';
import { RuleEditor } from './RuleEditor';

interface RulesPanelProps {
  /** List of rules for the current content type */
  rules: Rule[];
  /** Available fields from the content type */
  availableFields: Array<{
    id: string;
    name: string;
    type: FieldType;
    validations?: any[];
    items?: any;
  }>;
  /** Callback when rules change */
  onChange: (rules: Rule[]) => void;
  /** Whether the panel is disabled */
  disabled?: boolean;
  /** Whether there are unsaved changes */
  hasUnsavedChanges?: boolean;
  /** Callback to save rules */
  onSave?: () => void;
  /** Whether save is in progress */
  isSaving?: boolean;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({
  rules,
  availableFields,
  onChange,
  disabled = false,
  hasUnsavedChanges = false,
  onSave,
  isSaving = false,
}) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [expandedRuleIds, setExpandedRuleIds] = useState<Set<string>>(new Set());
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);

  const handleAddRule = () => {
    const newRule: Rule = {
      id: `rule-${Date.now()}-${Math.random()}`,
      name: 'New Rule',
      enabled: true,
      matchMode: MatchMode.ALL,
      conditions: [],
      actions: [],
    };

    onChange([...rules, newRule]);
    setEditingRuleId(newRule.id);
    setExpandedRuleIds(new Set([...expandedRuleIds, newRule.id]));
  };

  const handleToggleRule = (ruleId: string) => {
    const updatedRules = rules.map((rule) =>
      rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
    );
    onChange(updatedRules);
  };

  const handleEditRule = (ruleId: string) => {
    setEditingRuleId(ruleId);
    setExpandedRuleIds(new Set([...expandedRuleIds, ruleId]));
  };

  const handleToggleExpand = (ruleId: string) => {
    const isCurrentlyExpanded = expandedRuleIds.has(ruleId);

    if (isCurrentlyExpanded) {
      // Collapse and exit editing mode
      const newExpanded = new Set(expandedRuleIds);
      newExpanded.delete(ruleId);
      setExpandedRuleIds(newExpanded);
      if (editingRuleId === ruleId) {
        setEditingRuleId(null);
      }
    } else {
      // Expand and enter editing mode
      setExpandedRuleIds(new Set([...expandedRuleIds, ruleId]));
      setEditingRuleId(ruleId);
    }
  };

  const handleSaveRule = (updatedRule: Rule) => {
    const updatedRules = rules.map((rule) => (rule.id === updatedRule.id ? updatedRule : rule));
    onChange(updatedRules);
    setEditingRuleId(null);
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    setRuleToDelete(ruleId);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (ruleToDelete) {
      const updatedRules = rules.filter((rule) => rule.id !== ruleToDelete);
      onChange(updatedRules);
      setExpandedRuleIds((prev) => {
        const next = new Set(prev);
        next.delete(ruleToDelete);
        return next;
      });
    }
    setIsDeleteModalOpen(false);
    setRuleToDelete(null);
  };

  const getRuleSummary = (rule: Rule) => {
    const conditionsCount = rule.conditions.length;
    const actionsCount = rule.actions.length;
    return `${conditionsCount} condition${
      conditionsCount !== 1 ? 's' : ''
    }, ${actionsCount} action${actionsCount !== 1 ? 's' : ''}`;
  };

  return (
    <>
      <Stack flexDirection="column" spacing="spacingM" style={{ width: '100%' }}>
        <Flex justifyContent="space-between" alignItems="stretch">
          {hasUnsavedChanges && onSave ? (
            <Note
              variant="warning"
              style={{
                margin: 0,
                flex: 1,
                marginRight: '16px',
                display: 'flex',
                alignItems: 'center',
              }}>
              You have unsaved changes
            </Note>
          ) : (
            <Box style={{ flex: 1 }} />
          )}
          <Flex alignItems="center" gap="spacingS">
            {hasUnsavedChanges && onSave && (
              <Button
                variant="positive"
                onClick={onSave}
                isLoading={isSaving}
                isDisabled={isSaving}>
                Save Changes
              </Button>
            )}
            <Button
              variant="primary"
              startIcon={<PlusIcon />}
              onClick={handleAddRule}
              isDisabled={disabled}>
              Add Rule
            </Button>
          </Flex>
        </Flex>

        {rules.length === 0 && (
          <Flex
            flexDirection="column"
            alignItems="center"
            padding="spacingXl"
            style={{ textAlign: 'center' }}>
            <Text fontSize="fontSizeL" fontColor="gray600" marginBottom="spacingS">
              No rules configured yet
            </Text>
            <Text fontSize="fontSizeM" fontColor="gray500">
              Create your first field visibility rule
            </Text>
          </Flex>
        )}

        <Stack flexDirection="column" spacing="spacingS" style={{ width: '100%' }}>
          {rules.map((rule) => {
            const isExpanded = expandedRuleIds.has(rule.id);
            const isEditing = editingRuleId === rule.id;
            const editingRule = isEditing ? { ...rule } : rule;

            return (
              <Card key={rule.id} padding="none" style={{ width: '100%' }}>
                <Stack flexDirection="column" spacing="none" alignItems="stretch">
                  {/* Rule Header */}
                  <Flex
                    padding="spacingM"
                    justifyContent="space-between"
                    style={{
                      borderBottom: isExpanded ? '1px solid #e5ebed' : 'none',
                    }}
                    onClick={() => handleToggleExpand(rule.id)}>
                    <Flex alignItems="center" gap="spacingS">
                      <IconButton
                        variant="transparent"
                        icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        aria-label={isExpanded ? 'Collapse rule' : 'Expand rule'}
                        onClick={() => handleToggleExpand(rule.id)}
                      />
                      <Text fontWeight="fontWeightMedium" fontSize="fontSizeL">
                        {rule.name}
                      </Text>
                      {!rule.enabled && <Badge variant="secondary">Disabled</Badge>}
                    </Flex>

                    <Flex alignItems="center" gap="spacingM">
                      <Switch
                        id={`rule-enabled-${rule.id}`}
                        isChecked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        isDisabled={disabled}
                      />
                      <IconButton
                        variant="transparent"
                        icon={<DeleteIcon />}
                        aria-label="Delete rule"
                        onClick={() => handleDeleteRule(rule.id)}
                        isDisabled={disabled}
                      />
                    </Flex>
                  </Flex>

                  {/* Rule Editor (when expanded) */}
                  {isExpanded && isEditing && (
                    <Flex
                      padding="spacingL"
                      flexDirection="column"
                      gap="spacingM"
                      style={{ backgroundColor: '#f5f7f8' }}>
                      <RuleEditor
                        rule={editingRule}
                        availableFields={availableFields}
                        onChange={(updated) => {
                          // Update in real-time while editing
                          const updatedRules = rules.map((r) =>
                            r.id === updated.id ? updated : r
                          );
                          onChange(updatedRules);
                        }}
                        disabled={disabled}
                      />
                      <Flex justifyContent="flex-end" gap="spacingS">
                        <Button
                          variant="secondary"
                          onClick={handleCancelEdit}
                          isDisabled={disabled}>
                          Cancel
                        </Button>
                        <Button
                          variant="positive"
                          onClick={() => handleSaveRule(editingRule)}
                          isDisabled={disabled}>
                          Done
                        </Button>
                      </Flex>
                    </Flex>
                  )}
                </Stack>
              </Card>
            );
          })}
        </Stack>
      </Stack>

      {/* Delete Confirmation Modal */}
      <Modal onClose={() => setIsDeleteModalOpen(false)} isShown={isDeleteModalOpen}>
        {() => (
          <>
            <Modal.Header title="Delete Rule" onClose={() => setIsDeleteModalOpen(false)} />
            <Modal.Content>
              <Text>Are you sure you want to delete this rule? This action cannot be undone.</Text>
            </Modal.Content>
            <Modal.Controls>
              <Button variant="transparent" onClick={() => setIsDeleteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="negative" onClick={handleConfirmDelete}>
                Delete Rule
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </>
  );
};
