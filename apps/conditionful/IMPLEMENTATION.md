# Conditionful - Implementation Summary

## Overview

Conditionful is a Contentful app that enables conditional field visibility rules in the Entry Editor. Users can create rules to dynamically show or hide fields based on the values of other fields, with real-time evaluation.

## Features Implemented

### ✅ Core Functionality

1. **Entry Editor Location**
   - Custom tab in the Contentful Entry Editor
   - Two-panel interface: Rules Configuration and Field Preview

2. **Rules Configuration UI**
   - Add, edit, enable/disable, and delete rules
   - Name rules for easy identification
   - Configure match mode: "All" (AND) or "Any" (OR) conditions
   - Add multiple conditions per rule
   - Add multiple actions per rule

3. **Condition Editor**
   - Select target field from available fields
   - Type-specific operators based on field type
   - Dynamic value input based on field type

4. **Action Editor**
   - Show or hide multiple fields
   - Multi-select field picker with modal interface
   - Visual pills showing selected fields

5. **Supported Field Types & Operators**
   - **Text (Symbol, Text)**: equals, not equals, contains, not contains, is empty, is not empty
   - **Number (Integer, Number)**: equals, not equals, greater than, less than, greater than or equal, less than or equal
   - **Date**: equals, not equals, before, after
   - **Boolean**: is true, is false

6. **Real-time Rule Evaluation**
   - Rules are evaluated immediately as field values change
   - Fields are grayed out (disabled) when hidden by rules
   - Clear visual indicator showing "(Hidden by rules)"

7. **Data Persistence**
   - Rules stored in a dedicated Settings entry (content type: `conditionfulSettings`)
   - Organized by content type ID as JSON
   - Automatically creates content type and entry on first use
   - Shared across all users in the environment
   - Can be saved directly from Entry Editor

## Architecture

### File Structure

```
src/
├── types/
│   └── rules.ts                    # Type definitions for rules system
├── utils/
│   ├── rulesEngine.ts              # Core evaluation logic
│   ├── operatorMappings.ts         # Operator helpers and labels
│   └── settingsService.ts          # Settings entry management
├── components/
│   ├── RulesEditor/
│   │   ├── RulesPanel.tsx          # Main panel listing all rules
│   │   ├── RuleEditor.tsx          # Editor for single rule
│   │   ├── ConditionEditor.tsx     # Editor for conditions
│   │   ├── ActionEditor.tsx        # Editor for actions
│   │   └── index.ts                # Barrel export
│   └── FieldRenderer.tsx           # Renders fields with disabled state
├── locations/
│   ├── EntryEditor.tsx             # Main entry editor integration
│   └── ConfigScreen.tsx            # App configuration screen
└── ...

test/
└── rulesEngine.test.ts             # Comprehensive tests (18 tests)
```

### Key Components

#### 1. Rules Engine (`src/utils/rulesEngine.ts`)
- `evaluateCondition()`: Evaluates a single condition against a field value
- `evaluateRule()`: Evaluates all conditions in a rule based on match mode
- `getHiddenFields()`: Returns set of field IDs to hide based on all rules
- `isFieldHidden()`: Checks if a specific field should be hidden

#### 2. Rules Panel (`src/components/RulesEditor/RulesPanel.tsx`)
- Lists all rules with enable/disable toggles
- Expandable rule cards
- In-place editing with save/cancel
- Delete confirmation modal

#### 3. Settings Service (`src/utils/settingsService.ts`)
- Manages settings content type and entry creation
- Loads rules from settings entry on initialization
- Saves rules to settings entry with automatic publishing
- Handles content type creation if it doesn't exist

#### 4. Entry Editor (`src/locations/EntryEditor.tsx`)
- Tabbed interface (Rules Configuration / Field Preview)
- Real-time field value tracking with `onValueChanged` listeners
- Automatic rule re-evaluation on field changes
- Field rendering with disabled state
- "Save Rules" button to persist changes to settings entry
- Loading state while fetching rules

## Data Model

### Rule Structure
```typescript
interface Rule {
  id: string;
  name: string;
  enabled: boolean;
  matchMode: MatchMode; // 'all' | 'any'
  conditions: Condition[];
  actions: Action[];
}
```

### Condition Structure
```typescript
interface Condition {
  id: string;
  fieldId: string;
  fieldType: FieldType;
  operator: ConditionOperator;
  value?: string | number | boolean | Date;
}
```

### Action Structure
```typescript
interface Action {
  id: string;
  type: ActionType; // 'show' | 'hide'
  fieldIds: string[];
}
```

## Usage Guide

### Creating a Rule

1. Navigate to any entry in Contentful
2. Click on the "Conditionful" tab in the Entry Editor
3. Click "Add Rule"
4. Configure the rule:
   - Enter a name for the rule
   - Select match mode (All/Any)
   - Add conditions by clicking "Add Condition"
   - Select the field, operator, and value for each condition
   - Add actions by clicking "Add Action"
   - Select show/hide and choose target fields
5. Click "Save Rule" in the rule editor
6. Click the "Save Rules" button at the top to persist to the settings entry

### Field Preview

1. Switch to the "Field Preview" tab
2. See all fields with their current values
3. Fields hidden by rules will be grayed out
4. Edit field values to see rules evaluate in real-time

## Testing

The rules engine has comprehensive test coverage:

```bash
npm test
```

**Test Results**: 18 tests passing
- Text operator tests (equals, contains, isEmpty, etc.)
- Number operator tests (equals, greaterThan, lessThan, etc.)
- Date operator tests (before, after)
- Boolean operator tests (isTrue, isFalse)
- Rule evaluation tests (matchMode ALL/ANY)
- Hidden fields calculation tests

## Technical Highlights

### Forma 36 Components Used
- Stack, Flex, Box - Layout
- Tabs - Tabbed interface
- Card - Rule containers
- Form, FormControl, TextInput, Textarea, Select, Checkbox - Form inputs
- Button, IconButton - Actions
- Switch - Enable/disable rules
- Pill - Selected field tags
- Modal - Field selection and confirmations
- Note - Informational messages
- Heading, Text, Badge - Typography

### TypeScript Best Practices
- ✅ No `any` types used
- ✅ Strict type checking
- ✅ Proper type exports
- ✅ Generic types for flexibility
- ✅ Type guards and assertions

### React Best Practices
- ✅ Functional components with hooks
- ✅ Proper useEffect cleanup
- ✅ useMemo for expensive calculations
- ✅ useCallback for stable function references
- ✅ Controlled components for forms

### Contentful SDK Integration
- ✅ Entry field value listeners
- ✅ Installation parameters
- ✅ Content type inspection
- ✅ SDK notifications

## Known Limitations & Future Enhancements

### Current Limitations
1. Only basic field types supported (no Arrays, Links, RichText)
2. No rule import/export functionality
3. No rule validation warnings
4. Settings entry visible in content browser (could be hidden via API)

### Potential Enhancements
1. Add support for Array and Link field types
2. Add rule templates or presets
3. Add rule testing/preview mode
4. Add rule execution logs
5. Add rule priority/ordering
6. Add rule groups/categories
7. Export rules as JSON for backup
8. Add rule conflict detection
9. Add visual rule builder (flowchart style)
10. Add performance optimizations (debouncing, memoization)

## Performance Considerations

- Rules are re-evaluated on every field change
- Consider debouncing for text fields in production
- Current implementation is suitable for:
  - Up to 50 rules per content type
  - Up to 20 conditions per rule
  - Up to 100 fields per content type

## Accessibility

- All interactive elements have proper ARIA labels
- Keyboard navigation supported
- Screen reader friendly
- Color contrast meets WCAG AA standards (via Forma 36)

## Browser Support

Inherits support from Contentful App Framework:
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## License

Same as parent repository.

