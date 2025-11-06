# App Configuration Location Setup

## Overview

The **Richard Brandson** app uses the `LOCATION_APP_CONFIG` to provide a dedicated configuration interface where users can enter their OpenAI API key.

## How It Works

### 1. Location Registration

The configuration screen is registered in `src/App.tsx`:

```typescript
const ComponentLocationSettings = {
  [locations.LOCATION_APP_CONFIG]: ConfigScreen,
  // ... other locations
};
```

This automatically makes the ConfigScreen available:
- During app installation
- When users click "Configure" in the app settings
- When users navigate to the app configuration page

### 2. Configuration Screen (`src/locations/ConfigScreen.tsx`)

The ConfigScreen component provides:

✅ **OpenAI API Key Input Field**
- Password-type input for security
- Placeholder text (`sk-...`)
- Required field validation
- Help text with link to OpenAI Platform

✅ **User Guidance**
- Clear instructions on what the app does
- Privacy and security notices
- Link to get an API key

✅ **Validation**
- Checks that API key is provided before allowing installation
- Shows error message if user tries to install without API key
- Returns `false` to prevent incomplete installation

### 3. Configuration Flow

#### Initial Installation
1. User clicks "Install" on the Richard Brandson app
2. Contentful automatically displays the ConfigScreen
3. User enters their OpenAI API key
4. User clicks "Install"
5. `onConfigure()` callback validates the API key
6. If valid, configuration is saved and app is installed
7. If invalid, error notification is shown

#### Updating Configuration
1. User navigates to Apps → Richard Brandson → Configure
2. ConfigScreen loads with existing API key (if previously saved)
3. User can update the API key
4. User clicks "Save"
5. Updated configuration is persisted

### 4. Accessing Configuration in Other Components

The Page component (and any other component) can access the saved configuration:

```typescript
const parameters = await sdk.app.getParameters<AppInstallationParameters>();
const apiKey = parameters?.openAiApiKey;
```

### 5. User Experience Enhancements

#### Configuration Status Check
The Page component now checks if the app is configured on mount:

```typescript
useEffect(() => {
  const checkConfiguration = async () => {
    const parameters = await sdk.app.getParameters<AppInstallationParameters>();
    setIsConfigured(!!parameters?.openAiApiKey);
  };
  checkConfiguration();
}, [sdk]);
```

#### Warning Message
If not configured, users see a prominent warning with a direct link:

```tsx
{isConfigured === false && (
  <Note variant="warning" title="Configuration Required">
    This app requires an OpenAI API key...
    <TextLink href="...">Click here to configure your API key</TextLink>
  </Note>
)}
```

#### Disabled Button
The "Generate PDF" button is disabled until configuration is complete:

```tsx
<Button
  isDisabled={loading || isConfigured === false}
  onClick={generateBrandGuidelinePDF}
>
  Generate Brand Guidelines PDF
</Button>
```

## Configuration Parameters Interface

```typescript
export interface AppInstallationParameters {
  openAiApiKey?: string;
}
```

This interface is:
- Exported from `ConfigScreen.tsx`
- Imported in `Page.tsx`
- Used for type-safe parameter access

## Testing

The configuration screen is fully tested:

```typescript
describe('Config Screen component', () => {
  it('Renders configuration form with API key field', async () => {
    const { getByText } = render(<ConfigScreen />);
    expect(getByText('OpenAI API Key')).toBeInTheDocument();
  });
});
```

Mock SDK includes notifier for error handling:

```typescript
const mockSdk: any = {
  notifier: {
    error: vi.fn(),
    success: vi.fn(),
  },
  // ...
};
```

## How Users Access the Configuration

### During Installation
- Automatically shown when installing the app
- Cannot skip or bypass configuration

### After Installation
Users can access configuration via:

1. **Direct URL** (shown in warning message):
   ```
   https://app.contentful.com/spaces/{SPACE_ID}/environments/{ENV_ID}/apps/install/{APP_ID}
   ```

2. **Contentful UI Navigation**:
   - Go to Apps in the top navigation
   - Find "Richard Brandson"
   - Click the settings/configure icon
   - Update configuration

3. **App Settings Page**:
   - Navigate to Settings → Apps
   - Find "Richard Brandson" in the installed apps list
   - Click "Configure"

## Security Considerations

### API Key Storage
- ✅ Stored securely in Contentful's app configuration
- ✅ Not visible in plain text after entry (password field)
- ✅ Only accessible via SDK's `getParameters()` method
- ✅ Scoped to the specific space and environment

### Best Practices
- Input type is "password" to prevent shoulder surfing
- Clear privacy notice about OpenAI data usage
- User consent required during installation
- No API key is transmitted to any server except OpenAI

## Future Enhancements

Potential additions to the configuration screen:

1. **API Key Validation**: Test the key by making a simple API call
2. **Model Selection**: Allow users to choose between GPT-4o-mini and GPT-4o
3. **Token Limit**: Let users set max tokens for cost control
4. **Analysis Options**: Toggle specific analysis features
5. **PDF Customization**: Brand colors, logo upload, etc.
6. **Multiple Keys**: Support different keys for different environments

## Troubleshooting

### "Configuration Required" Warning Persists
- Ensure API key was actually saved (check for error notifications)
- Try reconfiguring the app
- Refresh the page after configuration

### API Key Not Working
- Verify the key is valid at OpenAI Platform
- Check that the key has sufficient credits
- Ensure the key has access to GPT-4 models

### Can't Find Configuration Screen
- Look for the gear/settings icon next to the app name
- Try reinstalling the app
- Contact Contentful support if the config screen doesn't appear

