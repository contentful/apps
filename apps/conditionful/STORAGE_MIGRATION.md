# Storage Migration - Settings Entry Implementation

## Overview

The Conditionful app now uses a dedicated Settings entry for storing rules configuration instead of installation parameters. This allows rules to be saved directly from the Entry Editor location.

## Changes Made

### 1. New Settings Service (`src/utils/settingsService.ts`)

Created a new service that manages:
- **Content Type Creation**: Automatically creates `conditionfulSettings` content type if it doesn't exist
- **Entry Management**: Creates and manages a single settings entry per environment
- **Rules Storage**: Stores rules as JSON in a Text field
- **Automatic Publishing**: Publishes entries after updates

#### Settings Content Type Structure
```typescript
{
  id: 'conditionfulSettings',
  name: 'Conditionful Settings',
  fields: [
    {
      id: 'title',
      type: 'Symbol',
      name: 'Title'
    },
    {
      id: 'rulesConfig',
      type: 'Text',
      name: 'Rules Configuration'
    }
  ]
}
```

### 2. Updated Entry Editor (`src/locations/EntryEditor.tsx`)

**New Features:**
- ✅ Loads rules from settings entry on initialization
- ✅ Shows loading spinner while fetching rules
- ✅ "Save Rules" button appears when there are unsaved changes
- ✅ Persists rules directly to settings entry
- ✅ Shows success/error notifications

**API Changes:**
- Now uses `useCMA()` hook to access Content Management API
- Initializes `SettingsService` on mount
- Saves rules via `settingsService.saveRules()`

### 3. Updated Config Screen (`src/locations/ConfigScreen.tsx`)

**Changes:**
- Now loads rules from settings entry to display summary
- Shows loading state while fetching rules
- Updated documentation to reflect new storage mechanism

### 4. Files Modified

**New Files:**
- `src/utils/settingsService.ts` - Settings entry management service

**Modified Files:**
- `src/locations/EntryEditor.tsx` - Settings service integration
- `src/locations/ConfigScreen.tsx` - Settings service integration
- `IMPLEMENTATION.md` - Updated documentation

## Migration Path

### For New Installations
1. Install the app
2. Navigate to any entry
3. Open the "Conditionful" tab
4. Settings content type and entry will be created automatically

### For Existing Installations (if any)
If rules were previously stored in installation parameters:
1. Rules would need to be manually re-created in the new system
2. Old installation parameters can be safely ignored

## Benefits

✅ **Editable from Entry Editor**: Rules can now be saved directly from the Entry Editor  
✅ **Real Persistence**: Rules survive browser refreshes and sessions  
✅ **Standard Contentful Pattern**: Uses established pattern from other apps (HubSpot, Klaviyo)  
✅ **CMA Integration**: Leverages Contentful's standard content management APIs  
✅ **Automatic Setup**: Content type and entry created automatically  

## Technical Details

### Settings Service API

```typescript
class SettingsService {
  constructor(config: {
    cma: CMAClient;
    spaceId: string;
    environmentId: string;
    defaultLocale: string;
  });

  // Initialize content type and entry
  async initialize(): Promise<void>;

  // Load all rules
  async loadRules(): Promise<RulesConfig>;

  // Save all rules
  async saveRules(rules: RulesConfig): Promise<void>;
}
```

### Usage Example

```typescript
const settingsService = new SettingsService({
  cma,
  spaceId: sdk.ids.space,
  environmentId: sdk.ids.environment,
  defaultLocale: sdk.locales.default,
});

await settingsService.initialize();

// Load rules
const allRules = await settingsService.loadRules();
const rulesForContentType = allRules[contentTypeId] || [];

// Save rules
const updatedRules = {
  ...allRules,
  [contentTypeId]: rules,
};
await settingsService.saveRules(updatedRules);
```

## Testing

✅ **Build Status**: Successful (no errors)  
✅ **Linter**: No errors  
✅ **Type Checking**: All TypeScript types valid  

## Notes

1. **Settings Entry Visibility**: The settings entry will appear in the content browser. This is normal and expected. Users should not edit it manually.

2. **Permissions**: The app requires CMA permissions to create content types and entries. These are standard permissions for Contentful apps.

3. **Performance**: Settings are loaded once on Entry Editor initialization and cached. Saves publish the entry immediately.

4. **Error Handling**: The service includes proper error handling and will show user-friendly notifications for any issues.

## Future Considerations

- Could hide the settings content type from the web app UI using the `omitted` flag
- Could add versioning/backup functionality for rules
- Could add import/export functionality for rules migration

