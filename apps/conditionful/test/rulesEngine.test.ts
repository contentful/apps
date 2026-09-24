/**
 * Tests for Rules Engine
 */

import { describe, it, expect } from 'vitest';
import {
  evaluateCondition,
  evaluateRule,
  getHiddenFields,
  isFieldHidden,
} from '../src/utils/rulesEngine';
import {
  Rule,
  Condition,
  Action,
  MatchMode,
  ActionType,
  TextOperator,
  NumberOperator,
  DateOperator,
  BooleanOperator,
  FieldValues,
} from '../src/types/rules';

describe('Rules Engine', () => {
  describe('evaluateCondition', () => {
    describe('Text operators', () => {
      it('should evaluate EQUALS correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'title',
          fieldType: 'Symbol',
          operator: TextOperator.EQUALS,
          value: 'Hello',
        };

        expect(evaluateCondition(condition, 'Hello')).toBe(true);
        expect(evaluateCondition(condition, 'World')).toBe(false);
      });

      it('should evaluate CONTAINS correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'title',
          fieldType: 'Text',
          operator: TextOperator.CONTAINS,
          value: 'test',
        };

        expect(evaluateCondition(condition, 'this is a test')).toBe(true);
        expect(evaluateCondition(condition, 'no match here')).toBe(false);
      });

      it('should evaluate IS_EMPTY correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'title',
          fieldType: 'Symbol',
          operator: TextOperator.IS_EMPTY,
        };

        expect(evaluateCondition(condition, '')).toBe(true);
        expect(evaluateCondition(condition, '   ')).toBe(true);
        expect(evaluateCondition(condition, 'not empty')).toBe(false);
      });

      it('should evaluate IS_NOT_EMPTY correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'title',
          fieldType: 'Symbol',
          operator: TextOperator.IS_NOT_EMPTY,
        };

        expect(evaluateCondition(condition, 'not empty')).toBe(true);
        expect(evaluateCondition(condition, '')).toBe(false);
      });
    });

    describe('Number operators', () => {
      it('should evaluate EQUALS correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'price',
          fieldType: 'Number',
          operator: NumberOperator.EQUALS,
          value: 100,
        };

        expect(evaluateCondition(condition, 100)).toBe(true);
        expect(evaluateCondition(condition, 50)).toBe(false);
      });

      it('should evaluate GREATER_THAN correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'price',
          fieldType: 'Integer',
          operator: NumberOperator.GREATER_THAN,
          value: 50,
        };

        expect(evaluateCondition(condition, 100)).toBe(true);
        expect(evaluateCondition(condition, 25)).toBe(false);
      });

      it('should evaluate LESS_THAN correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'price',
          fieldType: 'Number',
          operator: NumberOperator.LESS_THAN,
          value: 100,
        };

        expect(evaluateCondition(condition, 50)).toBe(true);
        expect(evaluateCondition(condition, 150)).toBe(false);
      });
    });

    describe('Date operators', () => {
      it('should evaluate BEFORE correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'publishDate',
          fieldType: 'Date',
          operator: DateOperator.BEFORE,
          value: new Date('2024-01-01'),
        };

        expect(evaluateCondition(condition, new Date('2023-12-31'))).toBe(true);
        expect(evaluateCondition(condition, new Date('2024-01-02'))).toBe(false);
      });

      it('should evaluate AFTER correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'publishDate',
          fieldType: 'Date',
          operator: DateOperator.AFTER,
          value: new Date('2024-01-01'),
        };

        expect(evaluateCondition(condition, new Date('2024-01-02'))).toBe(true);
        expect(evaluateCondition(condition, new Date('2023-12-31'))).toBe(false);
      });
    });

    describe('Boolean operators', () => {
      it('should evaluate IS_TRUE correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'isPublished',
          fieldType: 'Boolean',
          operator: BooleanOperator.IS_TRUE,
        };

        expect(evaluateCondition(condition, true)).toBe(true);
        expect(evaluateCondition(condition, false)).toBe(false);
      });

      it('should evaluate IS_FALSE correctly', () => {
        const condition: Condition = {
          id: '1',
          fieldId: 'isPublished',
          fieldType: 'Boolean',
          operator: BooleanOperator.IS_FALSE,
        };

        expect(evaluateCondition(condition, false)).toBe(true);
        expect(evaluateCondition(condition, true)).toBe(false);
      });
    });
  });

  describe('evaluateRule', () => {
    it('should return false for disabled rules', () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Rule',
        enabled: false,
        matchMode: MatchMode.ALL,
        conditions: [
          {
            id: '1',
            fieldId: 'title',
            fieldType: 'Symbol',
            operator: TextOperator.EQUALS,
            value: 'Hello',
          },
        ],
        actions: [],
      };

      const fieldValues: FieldValues = { title: 'Hello' };
      expect(evaluateRule(rule, fieldValues)).toBe(false);
    });

    it('should evaluate ALL match mode correctly', () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Rule',
        enabled: true,
        matchMode: MatchMode.ALL,
        conditions: [
          {
            id: '1',
            fieldId: 'title',
            fieldType: 'Symbol',
            operator: TextOperator.EQUALS,
            value: 'Hello',
          },
          {
            id: '2',
            fieldId: 'price',
            fieldType: 'Number',
            operator: NumberOperator.GREATER_THAN,
            value: 50,
          },
        ],
        actions: [],
      };

      expect(evaluateRule(rule, { title: 'Hello', price: 100 })).toBe(true);
      expect(evaluateRule(rule, { title: 'Hello', price: 25 })).toBe(false);
      expect(evaluateRule(rule, { title: 'World', price: 100 })).toBe(false);
    });

    it('should evaluate ANY match mode correctly', () => {
      const rule: Rule = {
        id: '1',
        name: 'Test Rule',
        enabled: true,
        matchMode: MatchMode.ANY,
        conditions: [
          {
            id: '1',
            fieldId: 'title',
            fieldType: 'Symbol',
            operator: TextOperator.EQUALS,
            value: 'Hello',
          },
          {
            id: '2',
            fieldId: 'price',
            fieldType: 'Number',
            operator: NumberOperator.GREATER_THAN,
            value: 50,
          },
        ],
        actions: [],
      };

      expect(evaluateRule(rule, { title: 'Hello', price: 100 })).toBe(true);
      expect(evaluateRule(rule, { title: 'Hello', price: 25 })).toBe(true);
      expect(evaluateRule(rule, { title: 'World', price: 100 })).toBe(true);
      expect(evaluateRule(rule, { title: 'World', price: 25 })).toBe(false);
    });
  });

  describe('getHiddenFields', () => {
    it('should return empty set when no rules match', () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          matchMode: MatchMode.ALL,
          conditions: [
            {
              id: '1',
              fieldId: 'title',
              fieldType: 'Symbol',
              operator: TextOperator.EQUALS,
              value: 'Hello',
            },
          ],
          actions: [
            {
              id: '1',
              type: ActionType.HIDE,
              fieldIds: ['description'],
            },
          ],
        },
      ];

      const fieldValues: FieldValues = { title: 'World' };
      const hiddenFields = getHiddenFields(rules, fieldValues);

      expect(hiddenFields.size).toBe(0);
    });

    it('should hide fields when rule matches', () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          matchMode: MatchMode.ALL,
          conditions: [
            {
              id: '1',
              fieldId: 'title',
              fieldType: 'Symbol',
              operator: TextOperator.EQUALS,
              value: 'Hello',
            },
          ],
          actions: [
            {
              id: '1',
              type: ActionType.HIDE,
              fieldIds: ['description', 'summary'],
            },
          ],
        },
      ];

      const fieldValues: FieldValues = { title: 'Hello' };
      const hiddenFields = getHiddenFields(rules, fieldValues);

      expect(hiddenFields.size).toBe(2);
      expect(hiddenFields.has('description')).toBe(true);
      expect(hiddenFields.has('summary')).toBe(true);
    });

    it('should handle SHOW action correctly', () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          matchMode: MatchMode.ALL,
          conditions: [
            {
              id: '1',
              fieldId: 'title',
              fieldType: 'Symbol',
              operator: TextOperator.EQUALS,
              value: 'Hello',
            },
          ],
          actions: [
            {
              id: '1',
              type: ActionType.SHOW,
              fieldIds: ['description'],
            },
          ],
        },
      ];

      const fieldValues: FieldValues = { title: 'Hello' };
      const hiddenFields = getHiddenFields(rules, fieldValues);

      expect(hiddenFields.size).toBe(0);
    });
  });

  describe('isFieldHidden', () => {
    it('should return true for hidden fields', () => {
      const rules: Rule[] = [
        {
          id: '1',
          name: 'Test Rule',
          enabled: true,
          matchMode: MatchMode.ALL,
          conditions: [
            {
              id: '1',
              fieldId: 'title',
              fieldType: 'Symbol',
              operator: TextOperator.EQUALS,
              value: 'Hello',
            },
          ],
          actions: [
            {
              id: '1',
              type: ActionType.HIDE,
              fieldIds: ['description'],
            },
          ],
        },
      ];

      const fieldValues: FieldValues = { title: 'Hello' };

      expect(isFieldHidden('description', rules, fieldValues)).toBe(true);
      expect(isFieldHidden('summary', rules, fieldValues)).toBe(false);
    });
  });
});

