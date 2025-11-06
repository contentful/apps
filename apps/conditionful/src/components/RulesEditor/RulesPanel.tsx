/**
 * RulesPanel Component
 * 
 * Main panel showing list of rules with enable/disable toggles and management options
 */

import React, { useState } from 'react';
import {
  Stack,
  Heading,
  Button,
  Card,
  Switch,
  Flex,
  IconButton,
  Text,
  Badge,
  Modal,
  Note,
} from '@contentful/f36-components';
import { PlusIcon, EditIcon, DeleteIcon, ChevronDownIcon, ChevronUpIcon } from '@contentful/f36-icons';
import { Rule, MatchMode, FieldType } from '../../types/rules';
import { RuleEditor } from './RuleEditor';

interface RulesPanelProps {
  /** List of rules for the current content type */
  rules: Rule[];
  /** Available fields from the content type */
  availableFields: Array<{ id: string; name: string; type: FieldType }>;
  /** Callback when rules change */
  onChange: (rules: Rule[]) => void;
  /** Whether the panel is disabled */
  disabled?: boolean;
}

export const RulesPanel: React.FC<RulesPanelProps> = ({
  rules,
  availableFields,
  onChange,
  disabled = false,
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

  const handleSaveRule = (updatedRule: Rule) => {
    const updatedRules = rules.map((rule) =>
      rule.id === updatedRule.id ? updatedRule : rule
    );
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

  const toggleExpanded = (ruleId: string) => {
    const newExpanded = new Set(expandedRuleIds);
    if (newExpanded.has(ruleId)) {
      newExpanded.delete(ruleId);
    } else {
      newExpanded.add(ruleId);
    }
    setExpandedRuleIds(newExpanded);
  };

  const getRuleSummary = (rule: Rule) => {
    const conditionsCount = rule.conditions.length;
    const actionsCount = rule.actions.length;
    return `${conditionsCount} condition${conditionsCount !== 1 ? 's' : ''}, ${actionsCount} action${actionsCount !== 1 ? 's' : ''}`;
  };

  return (
    <>
      <Stack flexDirection="column" spacing="spacingL" style={{ width: '100%' }}>
        <Flex justifyContent="space-between" alignItems="center">
          <Heading as="h2">Field Visibility Rules</Heading>
          <Button
            variant="primary"
            startIcon={<PlusIcon />}
            onClick={handleAddRule}
            isDisabled={disabled}
          >
            Add Rule
          </Button>
        </Flex>

        {rules.length === 0 && (
          <Note variant="primary">
            No rules configured yet. Click "Add Rule" to create your first rule.
          </Note>
        )}

        <Stack flexDirection="column" spacing="spacingM">
          {rules.map((rule) => {
            const isExpanded = expandedRuleIds.has(rule.id);
            const isEditing = editingRuleId === rule.id;
            const editingRule = isEditing ? { ...rule } : rule;

            return (
              <Card key={rule.id} padding="none">
                <Stack flexDirection="column" spacing="none">
                  {/* Rule Header */}
                  <Flex
                    padding="spacingM"
                    justifyContent="space-between"
                    alignItems="center"
                    style={{
                      borderBottom: isExpanded ? '1px solid #d3dce0' : 'none',
                    }}
                  >
                    <Flex alignItems="center" gap="spacingS" style={{ flex: 1 }}>
                      <IconButton
                        variant="transparent"
                        icon={isExpanded ? <ChevronUpIcon /> : <ChevronDownIcon />}
                        aria-label={isExpanded ? 'Collapse rule' : 'Expand rule'}
                        onClick={() => toggleExpanded(rule.id)}
                        size="small"
                      />
                      <Stack flexDirection="column" spacing="spacingXs" style={{ flex: 1 }}>
                        <Flex alignItems="center" gap="spacingXs">
                          <Text fontWeight="fontWeightDemiBold">{rule.name}</Text>
                          {!rule.enabled && (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </Flex>
                        <Text fontSize="fontSizeS" fontColor="gray500">
                          {getRuleSummary(rule)}
                        </Text>
                      </Stack>
                    </Flex>

                    <Flex alignItems="center" gap="spacingXs">
                      <Switch
                        id={`rule-enabled-${rule.id}`}
                        isChecked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        isDisabled={disabled}
                      />
                      <IconButton
                        variant="transparent"
                        icon={<EditIcon />}
                        aria-label="Edit rule"
                        onClick={() => handleEditRule(rule.id)}
                        isDisabled={disabled}
                        size="small"
                      />
                      <IconButton
                        variant="transparent"
                        icon={<DeleteIcon />}
                        aria-label="Delete rule"
                        onClick={() => handleDeleteRule(rule.id)}
                        isDisabled={disabled}
                        size="small"
                      />
                    </Flex>
                  </Flex>

                  {/* Rule Editor (when expanded) */}
                  {isExpanded && (
                    <div style={{ padding: '16px' }}>
                      {isEditing ? (
                        <Stack flexDirection="column" spacing="spacingM">
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
                              isDisabled={disabled}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="positive"
                              onClick={() => handleSaveRule(editingRule)}
                              isDisabled={disabled}
                            >
                              Save Rule
                            </Button>
                          </Flex>
                        </Stack>
                      ) : (
                        <Stack flexDirection="column" spacing="spacingS">
                          <Text>
                            <strong>Match:</strong> {rule.matchMode === MatchMode.ALL ? 'All' : 'Any'} conditions
                          </Text>
                          <Text>
                            <strong>Conditions:</strong> {rule.conditions.length}
                          </Text>
                          <Text>
                            <strong>Actions:</strong> {rule.actions.length}
                          </Text>
                          <Button
                            variant="secondary"
                            size="small"
                            onClick={() => handleEditRule(rule.id)}
                            isDisabled={disabled}
                          >
                            Edit Details
                          </Button>
                        </Stack>
                      )}
                    </div>
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
            <Modal.Header
              title="Delete Rule"
              onClose={() => setIsDeleteModalOpen(false)}
            />
            <Modal.Content>
              <Text>
                Are you sure you want to delete this rule? This action cannot be undone.
              </Text>
            </Modal.Content>
            <Modal.Controls>
              <Button
                variant="transparent"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="negative"
                onClick={handleConfirmDelete}
              >
                Delete Rule
              </Button>
            </Modal.Controls>
          </>
        )}
      </Modal>
    </>
  );
};

