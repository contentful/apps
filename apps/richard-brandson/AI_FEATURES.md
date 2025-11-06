# AI Features - Richard Brandson

## Overview

Richard Brandson is now an **AI-powered brand guidelines generator** that uses [GitHub Models](https://docs.github.com/en/rest/models/inference) (GPT-4o-mini) to analyze your Contentful space and create intelligent, actionable brand guidelines.

## Key Improvements from Basic Version

### Before (Content Summary)
- Simple listing of content types
- Basic entry counts
- Asset inventory
- No insights or recommendations

### After (AI-Powered Analysis)
- ✅ **Brand Voice Detection**: AI identifies your unique brand personality
- ✅ **Tone Analysis**: Understands formal vs. casual, empathetic vs. authoritative
- ✅ **Writing Style Guidelines**: Extracts patterns from your actual content
- ✅ **Key Themes**: Identifies recurring topics and subjects
- ✅ **Messaging Pillars**: Discovers your core value propositions
- ✅ **Do's and Don'ts**: Generates practical content creation guidelines
- ✅ **Content Patterns**: Identifies structural best practices
- ✅ **Visual Guidelines**: Infers visual style from asset analysis

## How the AI Analysis Works

### 1. Content Extraction
```
├── Fetch all content types
├── Fetch up to 1000 entries
├── Fetch up to 1000 assets
└── Extract text from rich text fields
```

### 2. Content Summarization
The app creates a comprehensive summary including:
- Content type names and descriptions
- Sample content from entries (up to 30 samples)
- Text extraction from various field types (plain text, rich text)
- Asset titles, descriptions, and types

### 3. AI Analysis
Sends the content summary to GitHub Models API with a specialized prompt to:
- Analyze brand voice characteristics
- Identify tone and communication style
- Extract writing patterns
- Find common themes
- Discover messaging frameworks
- Generate actionable recommendations

### 4. Structured Parsing
The AI response is parsed into structured sections:
- Brand Voice
- Tone Description
- Writing Style
- Key Themes (list)
- Messaging Pillars (list)
- Do's and Don'ts (categorized lists)
- Content Patterns
- Visual Style Notes

### 5. PDF Generation
Creates a professional multi-page PDF with:
- Title page with space information
- Executive summary
- AI-generated brand guidelines sections
- Color-coded do's (green) and don'ts (red)
- Appendix with content inventory

## Configuration

### App Installation Parameters
```typescript
interface AppInstallationParameters {
  githubModelsApiKey?: string;
}
```

### Validation
- GitHub Personal Access Token is required before installation can complete
- Token must have `models:read` scope
- Validation happens in ConfigScreen component
- User-friendly error messages guide configuration

## Technical Implementation

### New Files Created
1. **`src/services/brandAnalysis.ts`** - Core AI analysis service
   - `analyzeBrandContent()` - Main analysis function using GitHub Models API
   - `prepareContentSummary()` - Prepares content for AI
   - `extractTextFromRichText()` - Extracts text from Contentful rich text
   - `parseAIResponse()` - Structures AI output
   - `extractListItems()` - Parses lists from AI response

### Modified Files
1. **`src/locations/ConfigScreen.tsx`** - Added GitHub token configuration
2. **`src/locations/Page.tsx`** - Integrated AI analysis and enhanced PDF generation
3. **`test/mocks/mockSdk.ts`** - Added notifier and ids for testing

### Dependencies
- `jspdf` - PDF generation
- Uses native `fetch` for GitHub Models API calls (no additional dependencies needed)

## AI Model Configuration

### Model Selection
- **Model**: `gpt-4o-mini` (via GitHub Models)
- **API Endpoint**: `https://models.github.ai/inference/chat/completions`
- **Reason**: Free during preview, cost-effective while maintaining high quality
- **Temperature**: 0.7 (balanced creativity and consistency)
- **Max Tokens**: 2000 (comprehensive analysis)

### Authentication
- Uses GitHub Personal Access Token with `models:read` scope
- Token passed via `Authorization: Bearer {token}` header

### System Prompt
The AI is instructed to act as an expert brand strategist who creates comprehensive brand guidelines based on existing content analysis.

## Error Handling

- ✅ Missing GitHub token detection
- ✅ API call failure handling with detailed error messages
- ✅ HTTP status code checking
- ✅ User-friendly error messages
- ✅ Graceful degradation (shows error, doesn't crash)

## Future Enhancement Possibilities

1. **Model Selection**: Allow users to choose from available GitHub Models (GPT-4o-mini, GPT-4o, Meta Llama, DeepSeek, etc.)
2. **Custom Prompts**: Let users customize the analysis prompt
3. **Export Formats**: Add Word/HTML export options
4. **Brand Assets**: Include actual images in the PDF
5. **Multi-language**: Analyze content in multiple locales
6. **Competitive Analysis**: Compare against competitor guidelines
7. **Version History**: Track how brand guidelines evolve over time
8. **Custom Sections**: Allow users to add custom guideline sections
9. **Organization Attribution**: Use GitHub Models org endpoint for team usage tracking

## Testing

All tests passing ✅ (8/8):
- ConfigScreen renders with GitHub token field
- ConfigScreen validates token requirement
- Page component checks configuration status
- All other location components work as expected

## Cost Optimization & Benefits

The app is designed for efficiency and uses GitHub Models:
- **FREE** during GitHub Models preview period
- Uses cost-effective GPT-4o-mini model
- Sends only necessary content (first 30 entries)
- Truncates long text to 200 characters per field
- Single API call per PDF generation
- Rate limits based on GitHub account tier
- No direct costs for API usage (during preview)

