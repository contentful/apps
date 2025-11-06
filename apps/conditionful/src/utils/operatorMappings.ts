/**
 * Conditionful Rules Engine - Operator Mappings
 *
 * This file provides mappings and helper functions for working with operators
 * based on field types.
 */

import {
  FieldType,
  TextOperator,
  NumberOperator,
  DateOperator,
  BooleanOperator,
  ReferenceOperator,
  ConditionOperator,
} from '../types/rules';

/**
 * Get available operators for a given field type
 */
export function getOperatorsForFieldType(fieldType: FieldType): ConditionOperator[] {
  switch (fieldType) {
    case 'Symbol':
    case 'Text':
      return Object.values(TextOperator);
    case 'Integer':
    case 'Number':
      return Object.values(NumberOperator);
    case 'Date':
      return Object.values(DateOperator);
    case 'Boolean':
      return Object.values(BooleanOperator);
    case 'Link':
      return Object.values(ReferenceOperator);
    default:
      return [];
  }
}

/**
 * Get human-readable labels for operators
 */
export function getOperatorLabel(operator: ConditionOperator): string {
  const labels: Record<string, string> = {
    // Text operators
    [TextOperator.EQUALS]: 'Equals',
    [TextOperator.NOT_EQUALS]: 'Does not equal',
    [TextOperator.CONTAINS]: 'Contains',
    [TextOperator.NOT_CONTAINS]: 'Does not contain',
    [TextOperator.IS_EMPTY]: 'Is empty',
    [TextOperator.IS_NOT_EMPTY]: 'Is not empty',

    // Number operators
    [NumberOperator.EQUALS]: 'Equals',
    [NumberOperator.NOT_EQUALS]: 'Does not equal',
    [NumberOperator.GREATER_THAN]: 'Greater than',
    [NumberOperator.LESS_THAN]: 'Less than',
    [NumberOperator.GREATER_THAN_OR_EQUAL]: 'Greater than or equal to',
    [NumberOperator.LESS_THAN_OR_EQUAL]: 'Less than or equal to',

    // Date operators
    [DateOperator.EQUALS]: 'Equals',
    [DateOperator.NOT_EQUALS]: 'Does not equal',
    [DateOperator.BEFORE]: 'Is before',
    [DateOperator.AFTER]: 'Is after',

    // Boolean operators
    [BooleanOperator.IS_TRUE]: 'Is true',
    [BooleanOperator.IS_FALSE]: 'Is false',

    // Reference operators
    [ReferenceOperator.EQUALS]: 'Equals',
    [ReferenceOperator.NOT_EQUALS]: 'Does not equal',
    [ReferenceOperator.IS_EMPTY]: 'Is empty',
    [ReferenceOperator.IS_NOT_EMPTY]: 'Is not empty',
  };

  return labels[operator] || operator;
}

/**
 * Check if an operator requires a value input
 * Some operators like "isEmpty" or "isTrue" don't need a value
 */
export function operatorRequiresValue(operator: ConditionOperator): boolean {
  const noValueOperators = [
    TextOperator.IS_EMPTY,
    TextOperator.IS_NOT_EMPTY,
    BooleanOperator.IS_TRUE,
    BooleanOperator.IS_FALSE,
    ReferenceOperator.IS_EMPTY,
    ReferenceOperator.IS_NOT_EMPTY,
  ];

  return !noValueOperators.includes(operator as TextOperator | BooleanOperator | ReferenceOperator);
}

/**
 * Get the input type for a field type (used for value input fields)
 */
export function getInputTypeForFieldType(fieldType: FieldType): string {
  switch (fieldType) {
    case 'Symbol':
    case 'Text':
      return 'text';
    case 'Integer':
    case 'Number':
      return 'number';
    case 'Date':
      return 'date';
    case 'Boolean':
      return 'checkbox';
    case 'Link':
      return 'text'; // Entry ID as text
    default:
      return 'text';
  }
}

/**
 * Validate if a field type and operator combination is valid
 */
export function isValidOperatorForFieldType(
  fieldType: FieldType,
  operator: ConditionOperator
): boolean {
  const validOperators = getOperatorsForFieldType(fieldType);
  return validOperators.includes(operator);
}
