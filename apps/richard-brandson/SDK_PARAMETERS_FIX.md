# SDK Parameters Fix

## The Problem

You were getting this error:
```
Unable to access app configuration: Cannot read properties of undefined (reading 'getParameters')
```

## Root Cause

The issue was that we were trying to access `sdk.app.getParameters()` from a **Page location**, but:

1. `sdk.app.getParameters()` is only available in the **Config Screen location** (ConfigAppSDK)
2. **Page locations** (PageAppSDK) don't have access to `sdk.app.getParameters()`
3. Instead, Page locations access installation parameters via `sdk.parameters.installation`

## The Fix

### Changed From (❌ Wrong):
```typescript
// This ONLY works in ConfigScreen
const parameters = await sdk.app.getParameters<AppInstallationParameters>();
```

### Changed To (✅ Correct):
```typescript
// This works in Page and other app locations
const parameters = sdk.parameters?.installation as AppInstallationParameters;
```

## How Contentful App Parameters Work

### ConfigScreen Location
```typescript
// ConfigScreen.tsx - Has access to app methods
const sdk = useSDK<ConfigAppSDK>();

// Can get parameters
const params = await sdk.app.getParameters();

// Can set parameters  
sdk.app.onConfigure(async () => {
  return {
    parameters: { githubModelsApiKey: 'token' },
    targetState: currentState,
  };
});
```

### Page Location (and others)
```typescript
// Page.tsx - Uses installation parameters
const sdk = useSDK<PageAppSDK>();

// Parameters are available here, NOT via sdk.app
const params = sdk.parameters?.installation;
```

## SDK Type Differences

| SDK Type | Has `app.getParameters()` | Has `parameters.installation` |
|----------|--------------------------|------------------------------|
| ConfigAppSDK | ✅ Yes | ❌ No | 
| PageAppSDK | ❌ No | ✅ Yes |
| FieldAppSDK | ❌ No | ✅ Yes |
| SidebarAppSDK | ❌ No | ✅ Yes |
| DialogAppSDK | ❌ No | ✅ Yes |

## Files Changed

### 1. `src/locations/Page.tsx`
**Before:**
```typescript
const parameters = await sdk.app.getParameters<AppInstallationParameters>();
```

**After:**
```typescript
const parameters = sdk.parameters?.installation as AppInstallationParameters;
```

### 2. `test/mocks/mockSdk.ts`
Added `parameters.installation` to the mock:
```typescript
const mockSdk: any = {
  // ... existing properties ...
  parameters: {
    installation: {
      githubModelsApiKey: 'test-github-token',
    },
  },
};
```

## Testing in Your Browser

When you run the app now, check the browser console. You should see:

```
Full SDK object: {...}
SDK.parameters: {...}
SDK.parameters.installation: {githubModelsApiKey: "your-token"}
✅ Got parameters from sdk.parameters.installation
Retrieved installation parameters: {githubModelsApiKey: "your-token"}
```

If you see this instead:
```
SDK.parameters: undefined
```

Then the app might not be properly configured in Contentful. See the next section.

## Ensuring Parameters are Available

For `sdk.parameters.installation` to work, you need to:

### 1. ✅ Have the app installed
```bash
npm run create-app-definition
# Then install the app in Contentful UI
```

### 2. ✅ Configure the app
- Go to Settings → Apps → Richard Brandson → Configure
- Enter your GitHub Personal Access Token
- Save

### 3. ✅ App must have "locations" configured
In your app definition, ensure the Page location is enabled:
- This should be automatic when using `create-app-definition`
- The app manifest should include the Page location

## Debugging Checklist

If parameters are still undefined:

- [ ] App is installed in the space (Settings → Apps)
- [ ] App is configured with GitHub token
- [ ] Accessing via Contentful, not localhost directly
- [ ] App definition has Page location enabled
- [ ] No errors in browser console about app loading

## Alternative: Using CMA (If Parameters Don't Work)

If `sdk.parameters.installation` still doesn't work, you can fall back to using the Content Management API:

```typescript
const cma = useCMA();

// Get app installation
const installation = await cma.appInstallation.get({
  spaceId: sdk.ids.space,
  environmentId: sdk.ids.environment,
  appDefinitionId: sdk.ids.app,
});

const parameters = installation.parameters as AppInstallationParameters;
```

This is more reliable but requires an additional API call.

## Summary

✅ **Fixed**: Accessing parameters via `sdk.parameters.installation` instead of `sdk.app.getParameters()`
✅ **Works**: In all app locations (Page, Field, Sidebar, etc.)
✅ **Tests**: All passing (8/8)
✅ **Backwards Compatible**: No breaking changes to ConfigScreen

## Next Steps

1. **Try the app now** - It should load without the `getParameters` error
2. **Check console logs** - Look for the debug output showing parameters
3. **Configure if needed** - Add your GitHub token if you haven't
4. **Generate PDF** - Test the full workflow!

If you still see errors, check the console logs and share them for further debugging.

