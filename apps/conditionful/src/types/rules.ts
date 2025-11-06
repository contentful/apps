/**
 * Conditionful Rules Engine - Type Definitions
 *
 * This file defines the core types for the conditional field visibility rules system.
 */

/**
 * Supported Contentful field types for conditional logic
 */
export type FieldType = 'Symbol' | 'Text' | 'Integer' | 'Number' | 'Date' | 'Boolean' | 'Link';

/**
 * Operators for text-based fields (Symbol, Text)
 */
export enum TextOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'notContains',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty',
}

/**
 * Operators for numeric fields (Integer, Number)
 */
export enum NumberOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  GREATER_THAN = 'greaterThan',
  LESS_THAN = 'lessThan',
  GREATER_THAN_OR_EQUAL = 'greaterThanOrEqual',
  LESS_THAN_OR_EQUAL = 'lessThanOrEqual',
}

/**
 * Operators for date fields
 */
export enum DateOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  BEFORE = 'before',
  AFTER = 'after',
}

/**
 * Operators for boolean fields
 */
export enum BooleanOperator {
  IS_TRUE = 'isTrue',
  IS_FALSE = 'isFalse',
}

/**
 * Operators for reference fields (Link)
 */
export enum ReferenceOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'notEquals',
  IS_EMPTY = 'isEmpty',
  IS_NOT_EMPTY = 'isNotEmpty',
}

/**
 * Union type of all possible operators
 */
export type ConditionOperator =
  | TextOperator
  | NumberOperator
  | DateOperator
  | BooleanOperator
  | ReferenceOperator;

/**
 * Match mode for combining multiple conditions in a rule
 */
export enum MatchMode {
  ALL = 'all', // AND - all conditions must be true
  ANY = 'any', // OR - at least one condition must be true
}

/**
 * Action type - determines whether to show or hide fields
 */
export enum ActionType {
  SHOW = 'show',
  HIDE = 'hide',
}

/**
 * A condition that evaluates a field's value against a specified criteria
 */
export interface Condition {
  /** Unique identifier for the condition */
  id: string;
  /** The ID of the field to evaluate */
  fieldId: string;
  /** The type of the field being evaluated */
  fieldType: FieldType;
  /** The operator to use for comparison */
  operator: ConditionOperator;
  /** The value to compare against (undefined for operators like isEmpty, isTrue, etc.) */
  value?: string | number | boolean | Date;
}

/**
 * An action that affects the visibility of one or more fields
 */
export interface Action {
  /** Unique identifier for the action */
  id: string;
  /** Whether to show or hide the target fields */
  type: ActionType;
  /** Array of field IDs to show or hide */
  fieldIds: string[];
}

/**
 * A complete rule with conditions and actions
 */
export interface Rule {
  /** Unique identifier for the rule */
  id: string;
  /** Human-readable name for the rule */
  name: string;
  /** Whether the rule is currently active */
  enabled: boolean;
  /** How to combine multiple conditions (all/any) */
  matchMode: MatchMode;
  /** Array of conditions that must be satisfied */
  conditions: Condition[];
  /** Array of actions to perform when conditions are met */
  actions: Action[];
}

/**
 * Rules organized by content type ID
 */
export interface RulesConfig {
  [contentTypeId: string]: Rule[];
}

/**
 * Reference value structure from Contentful
 */
export interface ReferenceValue {
  sys: {
    id: string;
    type: 'Link';
    linkType: 'Entry' | 'Asset';
  };
}

/**
 * Helper type for field values from entry
 */
export type FieldValue =
  | string
  | number
  | boolean
  | Date
  | ReferenceValue
  | ReferenceValue[]
  | null
  | undefined;

/**
 * Map of field IDs to their current values
 */
export interface FieldValues {
  [fieldId: string]: FieldValue;
}
