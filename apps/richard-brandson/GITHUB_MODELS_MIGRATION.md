# Migration to GitHub Models

## Summary

Successfully migrated **Richard Brandson** from OpenAI direct API to GitHub Models API.

## What Changed

### 1. API Provider
- **Before**: OpenAI API (direct)
- **After**: GitHub Models API
- **Benefit**: Free during preview period, access to multiple AI models

### 2. Authentication
- **Before**: OpenAI API Key (`sk-...`)
- **After**: GitHub Personal Access Token (`github_pat_...` or `ghp_...`)
- **Required Scope**: `models:read`

### 3. API Integration
- **Before**: Used `openai` npm package
- **After**: Native `fetch` API calls to GitHub Models endpoint
- **Endpoint**: `https://models.github.ai/inference/chat/completions`
- **Benefit**: No additional dependencies, smaller bundle size

### 4. Configuration Interface
Updated the configuration screen to reflect GitHub Models:
- Field label changed to "GitHub Personal Access Token"
- Help text updated with instructions to get token from GitHub
- Placeholder changed to `github_pat_...`
- Privacy notice updated

## Technical Changes

### Code Changes

#### `src/locations/ConfigScreen.tsx`
```typescript
// Changed interface property
export interface AppInstallationParameters {
  githubModelsApiKey?: string; // was: openAiApiKey
}

// Updated validation message
sdk.notifier.error('Please provide a GitHub Models API key');

// Updated UI labels and help text
<FormControl.Label>GitHub Personal Access Token</FormControl.Label>
```

#### `src/services/brandAnalysis.ts`
```typescript
// Removed OpenAI SDK import
// import OpenAI from 'openai'; ❌

// Changed function signature
export async function analyzeBrandContent(
  contentData: ContentData,
  githubToken: string // was: apiKey
): Promise<BrandInsights>

// Replaced OpenAI SDK with fetch
const response = await fetch('https://models.github.ai/inference/chat/completions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${githubToken}`,
    'Accept': 'application/vnd.github+json',
  },
  body: JSON.stringify({
    model: 'gpt-4o-mini',
    messages: [...],
    temperature: 0.7,
    max_tokens: 2000,
  }),
});
```

#### `src/locations/Page.tsx`
```typescript
// Updated parameter reference
const parameters = await sdk.app.getParameters<AppInstallationParameters>();
if (!parameters?.githubModelsApiKey) { // was: openAiApiKey
  setError('GitHub Models API token not configured...');
}

// Updated function call
const brandInsights = await analyzeBrandContent(data, parameters.githubModelsApiKey);

// Updated warning message
<Note variant="warning" title="Configuration Required">
  This app requires a GitHub Personal Access Token...
</Note>
```

#### `src/locations/ConfigScreen.spec.tsx`
```typescript
// Updated test expectations
expect(getByText('GitHub Personal Access Token')).toBeInTheDocument();
```

### Dependency Changes

**Removed:**
- `openai` (v4.x) - No longer needed

**Added:**
- None (uses native fetch)

### Documentation Updates

Updated the following documentation files:
1. `USAGE.md` - User-facing instructions
2. `AI_FEATURES.md` - Technical AI implementation details
3. `APP_CONFIGURATION.md` - Configuration guide
4. Created `GITHUB_MODELS_MIGRATION.md` (this file)

## Benefits of GitHub Models

### 🆓 Cost Savings
- **Free during preview period** (vs. paid OpenAI API)
- No credit card required to get started
- Rate limits based on GitHub account tier

### 🔐 Security & Privacy
- GitHub's enterprise-grade security
- Uses existing GitHub authentication
- Clear privacy policies and data handling

### 🚀 Model Access
Access to multiple AI models through one API:
- OpenAI models (GPT-4o, GPT-4o-mini)
- Meta Llama models
- Microsoft Phi models
- DeepSeek models
- And more

### 📦 Smaller Bundle
- No additional npm dependencies
- Uses native fetch API
- Reduced bundle size

## Migration Checklist

- ✅ Updated ConfigScreen to accept GitHub token
- ✅ Updated brandAnalysis service to use GitHub Models API
- ✅ Updated parameter interface name
- ✅ Updated all references in Page component
- ✅ Updated tests
- ✅ Removed OpenAI dependency
- ✅ Updated all documentation
- ✅ All tests passing (8/8)
- ✅ No linting errors

## User Impact

### For New Users
- Install the app
- Provide GitHub Personal Access Token during configuration
- Generate brand guidelines for free

### For Existing Users (Future)
If users already have the app installed with OpenAI keys:
- They will need to reconfigure with a GitHub token
- A migration notice could be added to guide users
- Previous configurations will not work with new version

## API Comparison

| Feature | OpenAI API | GitHub Models API |
|---------|------------|-------------------|
| **Cost** | Paid ($0.01-$0.05/request) | Free (preview) |
| **Authentication** | API Key | GitHub PAT |
| **Models** | OpenAI only | Multiple providers |
| **Rate Limits** | Based on tier | Based on GitHub account |
| **Implementation** | SDK required | Native fetch |
| **Bundle Size** | +23 packages | 0 additional packages |

## Testing

All tests pass successfully:
```
✓ src/locations/ConfigScreen.spec.tsx (1 test)
✓ src/locations/Page.spec.tsx (2 tests)
✓ src/locations/EntryEditor.spec.tsx (1 test)
✓ src/locations/Field.spec.tsx (1 test)
✓ src/locations/Dialog.spec.tsx (1 test)
✓ src/locations/Sidebar.spec.tsx (1 test)
✓ src/locations/Home.spec.tsx (1 test)

Test Files: 7 passed (7)
Tests: 8 passed (8)
```

## Getting a GitHub Personal Access Token

Users can create a token at: https://github.com/settings/tokens

Steps:
1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Click "Generate new token" (classic or fine-grained)
3. Select the `models:read` scope
4. Generate and copy the token
5. Paste into Richard Brandson configuration

## API Documentation Reference

Official GitHub Models documentation:
- [GitHub Models Inference API](https://docs.github.com/en/rest/models/inference?apiVersion=2022-11-28)
- [GitHub Models Marketplace](https://github.com/marketplace/models)

## Future Enhancements

With GitHub Models, we can now:
1. Let users choose from multiple AI models
2. Use organizational attribution for team usage tracking
3. Access newer models as they become available
4. Leverage GitHub's usage analytics

