# Field Location Implementation

## Overview

The Conditionful app now controls field visibility through the **Field location** (LOCATION_ENTRY_FIELD) using Contentful's native field editors. This provides a seamless experience where fields are shown/hidden directly in the entry editor based on conditional rules.

## How It Works

### Field Location (`src/locations/Field.tsx`)

The Field location is applied to each field in a content type. When a field is rendered:

1. **Load Rules**: Fetch rules for the current content type from the settings entry
2. **Get Field Values**: Collect all field values from the entry
3. **Evaluate Rules**: Check if the current field should be hidden based on rules
4. **Render or Hide**: 
   - If hidden: Render `null` (field disappears from UI)
   - If shown: Render appropriate field editor based on type

### Real-Time Updates

- Listens to all field value changes in the entry
- Re-evaluates rules when any field value changes
- Automatically shows/hides fields based on updated conditions

### Supported Field Types

The Field location supports rendering these field types:

- **Symbol** → `SingleLineEditor` from `@contentful/field-editor-single-line`
- **Text** → `MultipleLineEditor` from `@contentful/field-editor-multiple-line`
- **Integer/Number** → `NumberEditor` from `@contentful/field-editor-number`
- **Date** → `DateEditor` from `@contentful/field-editor-date`
- **Boolean** → `BooleanEditor` from `@contentful/field-editor-boolean`

For unsupported field types, the component returns `null` and lets Contentful's default editor handle it.

## Dependencies Added

```json
{
  "@contentful/field-editor-boolean": "latest",
  "@contentful/field-editor-date": "latest",
  "@contentful/field-editor-number": "latest",
  "@contentful/field-editor-single-line": "latest",
  "@contentful/field-editor-multiple-line": "latest"
}
```

## Entry Editor vs Field Location

### Entry Editor (Rules Configuration)
- Location: `LOCATION_ENTRY_EDITOR`
- Purpose: Configure rules, manage rules, preview behavior
- Shows: Rules Configuration + Field Preview tabs

### Field Location (Rules Application)
- Location: `LOCATION_ENTRY_FIELD`
- Purpose: Apply rules to individual fields in real-time
- Shows: Native field editor or nothing (if hidden)

## Architecture

```
┌─────────────────────────────────────────┐
│   Entry Editor (Rules Config)           │
│   - RulesPanel                          │
│   - Create/Edit/Delete Rules            │
│   - Field Preview                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│   Field Location (Per Field)            │
│   1. Load rules from settings           │
│   2. Get all field values               │
│   3. Evaluate: isFieldHidden()?         │
│   4. Render field editor or null        │
└─────────────────────────────────────────┘
         │
         ├─→ Symbol → SingleLineEditor
         ├─→ Text → MultipleLineEditor
         ├─→ Number → NumberEditor
         ├─→ Date → DateEditor
         └─→ Boolean → BooleanEditor
```

## Setup Instructions

### 1. App Definition Configuration

In your app definition, add the Field location for the content types you want to apply rules to:

```json
{
  "locations": [
    {
      "location": "entry-field",
      "fieldTypes": [
        { "type": "Symbol" },
        { "type": "Text" },
        { "type": "Integer" },
        { "type": "Number" },
        { "type": "Date" },
        { "type": "Boolean" }
      ]
    },
    {
      "location": "entry-editor"
    },
    {
      "location": "app-config"
    }
  ]
}
```

### 2. Assign App to Fields

For each field you want to control:
1. Go to Content Model
2. Edit the content type
3. Select a field
4. Under "Appearance", choose "Conditionful" app

### 3. Create Rules

1. Open any entry of that content type
2. Go to the "Conditionful" tab
3. Create rules with conditions and actions
4. Click "Save Rules"

### 4. See Rules in Action

1. Switch back to the entry's content tab
2. Edit field values that are used in conditions
3. Watch fields appear/disappear in real-time!

## Debug Logging

The Field location includes comprehensive debug logging:

```javascript
console.log('[Field] Initializing for field:', currentFieldId, 'type:', fieldType);
console.log('[Field] Rules loaded for content type:', contentTypeId, rulesForContentType);
console.log('[Field] Initial value for', fieldId, '=', value);
console.log('[Field] Field', currentFieldId, 'is hidden:', hidden);
console.log('[Field] Field value changed:', fieldId, '=', newValue);
console.log('[Field] Re-evaluated field', currentFieldId, 'is hidden:', nowHidden);
console.log('[Field] Rendering: Field is hidden by rules');
console.log('[Field] Rendering: Field editor for type', fieldType);
```

Filter console by `[Field]` to see Field location specific logs.

## Benefits

✅ **Native Experience**: Uses Contentful's official field editors  
✅ **Real-Time**: Fields show/hide immediately as conditions change  
✅ **Per-Field Control**: Each field independently evaluates rules  
✅ **Seamless Integration**: No custom UI needed, works with existing entry editor  
✅ **Type-Safe**: Proper TypeScript types for all field editors  
✅ **Lazy Loading**: Field editors are code-split for better performance  

## Performance Considerations

- **Lazy Loading**: Field editors are loaded on-demand using React's `lazy()`
- **Memoization**: Field editor rendering is memoized to avoid re-renders
- **Auto-Resizer**: Uses `useAutoResizer()` to adjust field height automatically
- **Efficient Updates**: Only re-evaluates rules when field values actually change

## Limitations

1. **Unsupported Field Types**: Array, Link, RichText, Location fields fall back to default editor
2. **Initial Load**: Brief spinner shown while rules load
3. **Validation**: Hidden fields still validate (they're hidden, not removed from entry)

## Future Enhancements

1. Add support for more field types (Array, Link, RichText)
2. Add visual indicator when field is hidden by rules (optional message)
3. Add animation when fields appear/disappear
4. Cache rules to avoid reloading on every field render
5. Add rule testing mode to preview changes before saving

## Comparison: Field Preview vs Field Location

### Field Preview (Entry Editor Tab)
- Shows all fields with disabled state
- Visual preview only
- Useful for testing rules
- Static representation

### Field Location (Active Fields)
- Controls actual field visibility
- Fields completely hidden when rules match
- Production usage
- Dynamic real-time behavior

Both approaches can be used together:
- Use Entry Editor to configure and test rules
- Use Field Location for actual field visibility control in production

