# Richard Brandson - AI-Powered Brand Guidelines Generator

A Contentful app that uses AI to analyze your content and automatically generates comprehensive, intelligent Brand Guidelines PDF documents.

## Features

- 🤖 **AI-Powered Analysis**: Uses GitHub Models to analyze your content and extract brand insights
- 🎯 **Smart Brand Voice Detection**: Automatically identifies your brand's voice, tone, and writing style
- 📊 **Automatic Content Discovery**: Scans and analyzes all content types, entries, and assets in your space
- 📄 **Professional PDF Generation**: Creates beautifully formatted brand guidelines documents
- ⚡ **One-Click Export**: Download your comprehensive brand guidelines instantly

## What's Included in the AI-Generated PDF

The generated PDF includes:

### AI-Powered Insights
1. **Brand Voice Analysis**: AI-identified brand personality and voice characteristics
2. **Tone & Communication Style**: Detailed analysis of how your brand communicates
3. **Writing Style Guidelines**: Patterns in sentence structure, language, and formatting
4. **Key Themes**: Main topics and themes that appear across your content
5. **Messaging Pillars**: Core value propositions and messaging frameworks
6. **Content Do's and Don'ts**: Practical recommendations for content creation
7. **Content Patterns**: Structural patterns and best practices from your content
8. **Visual Style Guidelines**: Inferred visual preferences based on asset analysis

### Content Inventory (Appendix)
9. **Content Summary**: Total counts of content types, entries, and assets
10. **Content Type Definitions**: Complete list of all content types with descriptions

## How to Use

### Installation & Configuration

1. Install the app in your Contentful space
2. During installation, you'll be prompted to configure the app
3. **Enter your GitHub Personal Access Token**:
   - Get your token from [GitHub Settings → Personal access tokens](https://github.com/settings/tokens)
   - The token should start with `github_pat_` or `ghp_`
   - Required scope: `models:read`
   - Your token is stored securely in Contentful's app configuration
4. Click "Install" to complete the setup

### Generating AI-Powered Brand Guidelines

1. Navigate to the app from the "Apps" section in Contentful
2. Click the "Generate Brand Guidelines PDF" button
3. The app will:
   - Fetch all content from your space (entries, assets, content types)
   - Send content to GitHub Models API for AI analysis
   - Generate comprehensive brand insights
   - Create a professionally formatted PDF
4. The PDF will automatically download to your device

**Note**: First-time generation may take 30-60 seconds depending on the amount of content in your space.

### Development

To run the app locally:

```bash
npm start
```

To build for production:

```bash
npm run build
```

To deploy:

```bash
npm run upload
```

## Technical Details

- Built with React and TypeScript
- Uses Contentful's App SDK and Management API
- AI analysis powered by [GitHub Models](https://docs.github.com/en/rest/models/inference) (GPT-4o-mini)
- PDF generation powered by jsPDF
- UI components from Forma 36 (Contentful's design system)

## Requirements

- Node.js 18+ 
- A Contentful space with content
- GitHub Personal Access Token with `models:read` scope
- Appropriate permissions to read content from the space

## Privacy & Security

- Your GitHub token is stored securely in Contentful's app configuration
- Content from your space is sent to GitHub Models API for analysis
- GitHub Models provides access to various AI models from OpenAI, Meta, Microsoft, and more
- No content is stored by the app - all processing happens in real-time
- Generated PDFs are created client-side and downloaded directly to your device
- Please review [GitHub's data usage policies](https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement) before using this app

## Cost Considerations

GitHub Models is currently free during preview:
- Model used: GPT-4o-mini (via GitHub Models)
- **FREE during preview period** - no direct costs for API usage
- Rate limits apply based on your GitHub account
- Monitor your usage at [GitHub Models dashboard](https://github.com/marketplace/models)
- Check [GitHub Models documentation](https://docs.github.com/en/rest/models/inference) for current pricing and limits

