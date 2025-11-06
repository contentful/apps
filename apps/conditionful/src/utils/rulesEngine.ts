/**
 * Conditionful Rules Engine - Core Evaluation Logic
 *
 * This file contains the logic for evaluating rules and determining which fields
 * should be hidden based on the current state of entry field values.
 */

import {
  Rule,
  Condition,
  Action,
  ActionType,
  MatchMode,
  FieldValue,
  FieldValues,
  TextOperator,
  NumberOperator,
  DateOperator,
  BooleanOperator,
} from '../types/rules';

/**
 * Evaluate a single condition against a field value
 */
export function evaluateCondition(condition: Condition, fieldValue: FieldValue): boolean {
  const { operator, value: conditionValue, fieldType } = condition;

  // Handle text-based fields (Symbol, Text)
  if (fieldType === 'Symbol' || fieldType === 'Text') {
    const stringValue = fieldValue?.toString() || '';
    const compareValue = conditionValue?.toString() || '';

    switch (operator as TextOperator) {
      case TextOperator.EQUALS:
        return stringValue === compareValue;
      case TextOperator.NOT_EQUALS:
        return stringValue !== compareValue;
      case TextOperator.CONTAINS:
        return stringValue.includes(compareValue);
      case TextOperator.NOT_CONTAINS:
        return !stringValue.includes(compareValue);
      case TextOperator.IS_EMPTY:
        return stringValue.trim() === '';
      case TextOperator.IS_NOT_EMPTY:
        return stringValue.trim() !== '';
      default:
        return false;
    }
  }

  // Handle numeric fields (Integer, Number)
  if (fieldType === 'Integer' || fieldType === 'Number') {
    const numValue =
      typeof fieldValue === 'number' ? fieldValue : parseFloat(fieldValue?.toString() || '0');
    const compareNum =
      typeof conditionValue === 'number'
        ? conditionValue
        : parseFloat(conditionValue?.toString() || '0');

    // Return false if values are NaN
    if (isNaN(numValue) || isNaN(compareNum)) {
      return false;
    }

    switch (operator as NumberOperator) {
      case NumberOperator.EQUALS:
        return numValue === compareNum;
      case NumberOperator.NOT_EQUALS:
        return numValue !== compareNum;
      case NumberOperator.GREATER_THAN:
        return numValue > compareNum;
      case NumberOperator.LESS_THAN:
        return numValue < compareNum;
      case NumberOperator.GREATER_THAN_OR_EQUAL:
        return numValue >= compareNum;
      case NumberOperator.LESS_THAN_OR_EQUAL:
        return numValue <= compareNum;
      default:
        return false;
    }
  }

  // Handle date fields
  if (fieldType === 'Date') {
    const dateValue =
      fieldValue instanceof Date ? fieldValue : new Date(fieldValue?.toString() || '');
    const compareDate =
      conditionValue instanceof Date ? conditionValue : new Date(conditionValue?.toString() || '');

    // Return false if dates are invalid
    if (isNaN(dateValue.getTime()) || isNaN(compareDate.getTime())) {
      return false;
    }

    switch (operator as DateOperator) {
      case DateOperator.EQUALS:
        return dateValue.getTime() === compareDate.getTime();
      case DateOperator.NOT_EQUALS:
        return dateValue.getTime() !== compareDate.getTime();
      case DateOperator.BEFORE:
        return dateValue.getTime() < compareDate.getTime();
      case DateOperator.AFTER:
        return dateValue.getTime() > compareDate.getTime();
      default:
        return false;
    }
  }

  // Handle boolean fields
  if (fieldType === 'Boolean') {
    const boolValue = Boolean(fieldValue);

    switch (operator as BooleanOperator) {
      case BooleanOperator.IS_TRUE:
        return boolValue === true;
      case BooleanOperator.IS_FALSE:
        return boolValue === false;
      default:
        return false;
    }
  }

  return false;
}

/**
 * Evaluate all conditions in a rule based on the match mode
 */
export function evaluateRule(rule: Rule, fieldValues: FieldValues): boolean {
  // Skip disabled rules
  if (!rule.enabled) {
    return false;
  }

  // If there are no conditions, the rule doesn't match
  if (rule.conditions.length === 0) {
    return false;
  }

  // Evaluate each condition
  const conditionResults = rule.conditions.map((condition) => {
    const fieldValue = fieldValues[condition.fieldId];
    return evaluateCondition(condition, fieldValue);
  });

  // Apply match mode (all/any)
  if (rule.matchMode === MatchMode.ALL) {
    // ALL conditions must be true
    return conditionResults.every((result) => result === true);
  } else {
    // ANY condition must be true
    return conditionResults.some((result) => result === true);
  }
}

/**
 * Get the set of field IDs that should be hidden based on all rules
 */
export function getHiddenFields(rules: Rule[], fieldValues: FieldValues): Set<string> {
  const hiddenFields = new Set<string>();
  const shownFields = new Set<string>();

  // Evaluate each rule
  rules.forEach((rule) => {
    const ruleMatches = evaluateRule(rule, fieldValues);

    if (ruleMatches) {
      // Apply each action in the rule
      rule.actions.forEach((action: Action) => {
        action.fieldIds.forEach((fieldId) => {
          if (action.type === ActionType.HIDE) {
            hiddenFields.add(fieldId);
            shownFields.delete(fieldId); // Remove from shown if previously added
          } else if (action.type === ActionType.SHOW) {
            shownFields.add(fieldId);
            hiddenFields.delete(fieldId); // Remove from hidden if previously added
          }
        });
      });
    }
  });

  // Return the final set of hidden fields
  // (shown fields take precedence if there's a conflict)
  return hiddenFields;
}

/**
 * Check if a specific field should be hidden based on rules
 */
export function isFieldHidden(fieldId: string, rules: Rule[], fieldValues: FieldValues): boolean {
  const hiddenFields = getHiddenFields(rules, fieldValues);
  return hiddenFields.has(fieldId);
}

/**
 * Get information about which rules are hiding a specific field
 */
export function getFieldHidingRules(
  fieldId: string,
  rules: Rule[],
  fieldValues: FieldValues
): { isHidden: boolean; hidingRules: Rule[] } {
  const hidingRules: Rule[] = [];
  let isHidden = false;

  rules.forEach((rule) => {
    if (!rule.enabled) return;

    const ruleMatches = evaluateRule(rule, fieldValues);

    if (ruleMatches) {
      // Check if this rule has an action that hides the target field
      rule.actions.forEach((action) => {
        if (action.type === ActionType.HIDE && action.fieldIds.includes(fieldId)) {
          console.log(`[Conditionful] Hiding field "${fieldId}" due to rule "${rule.name}"`);
          hidingRules.push(rule);
          isHidden = true;
        } else if (action.type === ActionType.SHOW && action.fieldIds.includes(fieldId)) {
          console.log(`[Conditionful] Showing field "${fieldId}" due to rule "${rule.name}"`);
          // Show action takes precedence, remove from hiding rules
          const index = hidingRules.findIndex((r) => r.id === rule.id);
          if (index > -1) {
            hidingRules.splice(index, 1);
          }
          isHidden = false;
        }
      });
    }
  });

  return { isHidden, hidingRules };
}

/**
 * Get a map of field IDs to their visibility state
 */
export function getFieldVisibilityMap(
  rules: Rule[],
  fieldValues: FieldValues,
  allFieldIds: string[]
): Record<string, boolean> {
  const hiddenFields = getHiddenFields(rules, fieldValues);
  const visibilityMap: Record<string, boolean> = {};

  allFieldIds.forEach((fieldId) => {
    visibilityMap[fieldId] = !hiddenFields.has(fieldId);
  });

  return visibilityMap;
}
