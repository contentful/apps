# Set Options Action Feature

## Overview
Added a new "Set Options" action type that allows configuring a subset of allowed entries for reference fields. This feature is only available for reference fields (Link and Array types).

## What Was Implemented

### 1. Updated Types (`src/types/rules.ts`)
- Added `SET_OPTIONS = 'setOptions'` to the `ActionType` enum
- Extended the `Action` interface with an optional `allowedEntries?: string[]` property to store the IDs of entries that editors can choose from

### 2. Enhanced ActionEditor (`src/components/RulesEditor/ActionEditor.tsx`)
- Added "Set Options" as a third action type option
- Automatically filters to show only reference fields (Link/Array) when "Set Options" is selected
- Limited field selection to a single reference field for "Set Options" actions
- Added a second modal for selecting specific entries from the referenced content type
- Implemented entry fetching using the CMA client:
  - Reads the `linkContentType` validation from the reference field
  - Fetches all entries from the referenced content type(s)
  - Displays entries in a scrollable modal with checkboxes
- Shows selected entries as pills with the ability to remove them
- Displays entry titles intelligently (falls back to entry ID if no title field found)

### 3. Updated Field Structure
Modified the `availableFields` prop throughout the component tree to include field validations:
- `EntryEditor.tsx`: Added `validations` to the fields mapping
- `ConditionEditor.tsx`: Updated prop types to accept validations
- `RuleEditor.tsx`: Updated prop types to accept validations
- `RulesPanel.tsx`: Updated prop types to accept validations

## How It Works

### User Flow
1. **Create a rule** with conditions as usual
2. **Add an action** and select "Set Options" from the action type dropdown
3. **Select a reference field** from the "Select Reference Field" button
   - Only reference fields (Link/Array types) are shown
   - Only one field can be selected
4. **Select allowed entries** from the "Select Entries" button
   - Opens a modal that fetches all entries from the referenced content type
   - User can select multiple entries using checkboxes
   - Selected entries appear as pills
5. **Save the rule** - When the rule's conditions are met, the reference field will only show the selected entries as options

### Technical Details
- Uses the CMA client (`useCMA()` hook) to fetch entries
- Reads field validations to determine which content types are linked
- Handles multiple referenced content types (fetches from all)
- Supports both single references (Link) and multi-references (Array)
- Entry title extraction tries `title`, `name`, and `displayName` fields
- Loading states and error handling included

## Files Changed
1. `src/types/rules.ts` - Added SET_OPTIONS type and allowedEntries field
2. `src/components/RulesEditor/ActionEditor.tsx` - Complete rewrite with new features
3. `src/locations/EntryEditor.tsx` - Added validations to availableFields
4. `src/components/RulesEditor/ConditionEditor.tsx` - Updated prop types
5. `src/components/RulesEditor/RuleEditor.tsx` - Updated prop types
6. `src/components/RulesEditor/RulesPanel.tsx` - Updated prop types

## Usage Example

**Use Case:** Show only specific product entries when a category is selected

1. **Condition:** If "category" field equals "Electronics"
2. **Action:** Set Options on "featured_products" reference field
3. **Allowed Entries:** Select only the electronics products from the list

When editors work on entries where the category is "Electronics", they will only be able to select from the pre-defined list of electronics products for the "featured_products" field.

## Design Decisions

### Why only reference fields?
The "Set Options" action is specifically designed for reference fields because:
- Reference fields link to other entries
- Setting allowed options makes sense only for references
- Other field types (text, number, etc.) don't have a finite set of entry options

### Why single field selection?
For "Set Options", we limit to one field at a time because:
- Each reference field may link to different content types
- Each field needs its own specific list of allowed entries
- This keeps the UI simple and the configuration clear

### Entry fetching strategy
- Fetches up to 1000 entries per content type (CMA limit)
- Loads all at once in the modal (vs pagination) for better UX when selecting
- Caches entries in component state during modal session
- Includes error handling for failed fetches

## Future Enhancements
Possible improvements for future iterations:
- Pagination for content types with >1000 entries
- Search/filter functionality in the entry selection modal
- Display entry status (draft/published) in the selection list
- Support for asset references (currently only entry references)
- Preview of entry content in the selection modal

