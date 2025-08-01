# Rich Text Versioning App

A Contentful app that provides rich text versioning capabilities and allows viewing published entry data from the Content Delivery API (CDA), including rich text content converted to HTML.

## Features

- **Rich Text Versioning**: Track and manage versions of rich text content
- **Published Data Viewer**: View published entry data directly from the Content Delivery API
- **Rich Text HTML Conversion**: Convert rich text documents to HTML using `documentToHtmlString`
- **Content Type Detection**: Automatically detect and properly display rich text fields
- **Draft Entry Detection**: Show appropriate message when entry is not published
- **Enhanced Error Handling**: Detailed error messages for different CDA scenarios
- **Connection Validation**: Validate CDA connection before attempting to fetch data
- **Real-time Updates**: Refresh published data to see the latest changes

## Setup

### Prerequisites

- Node.js v18+
- npm or yarn
- Contentful space with appropriate permissions

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Create a .env file in the root directory
   REACT_APP_CDA_TOKEN=your_content_delivery_api_token
   ```

### Configuration

To use the published data viewer functionality, you need to:

1. **Get a Content Delivery API Token**:
   - Go to your Contentful space settings
   - Navigate to API keys
   - Create a new API key or use an existing one
   - Copy the Content Delivery API - access token

2. **Set the Environment Variable**:
   ```bash
   export REACT_APP_CDA_TOKEN=your_cda_token_here
   ```

## Usage

### Field Location

The app can be installed as a field extension in Contentful. Once installed:

1. Navigate to any entry in Contentful
2. The app will show a "Show Published Entry Data" button
3. Click the button to view the published version of the current entry
4. The published data includes:
   - System information (ID, content type, creation date, etc.)
   - All published field values
   - Rich text content converted to HTML
   - Metadata about the entry

### Published Data Viewer

The published data viewer displays:

- **Entry Information**: ID, content type, and metadata
- **System Information**: Creation, update, and publication dates
- **Field Values**: All published field values with proper formatting
- **Rich Text Content**: Rich text fields converted to HTML with:
  - Formatted HTML display
  - Character count
  - Rich text field identification badge
- **Refresh Capability**: Button to reload the latest published data

### Draft Entry Handling

When an entry is not published, the app displays:

- **Clear Warning Message**: "Entry is not published" heading
- **Explanation**: Details about why published data is not available
- **Entry Information**: Basic entry details (ID, content type, creation date)
- **Check Again Button**: Allows users to refresh and check if the entry has been published

### Error Handling

The app provides comprehensive error handling for different scenarios:

- **Connection Errors**: Validates CDA connection before fetching data
- **Entry Not Found**: Clear message when entry doesn't exist or isn't published
- **Environment Errors**: Specific messages for incorrect environment configuration
- **Authentication Errors**: Clear feedback for token/permission issues
- **Configuration Details**: Shows all relevant configuration in error state

### Rich Text Handling

The app automatically detects rich text fields and converts them to HTML using `documentToHtmlString`:

- **Automatic Detection**: Uses content type information to identify rich text fields
- **HTML Conversion**: Converts rich text documents to readable HTML
- **Visual Display**: Shows the HTML content in a formatted container
- **Metadata**: Displays character count and field type information

## Development

### Running the App

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build
```

### Testing

The app includes comprehensive tests for all components:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Project Structure

```
src/
├── components/
│   └── PublishedEntryViewer.tsx    # Component for displaying published data
├── services/
│   └── cdaService.ts               # Service for Content Delivery API calls
├── locations/
│   ├── ConfigScreen.tsx            # App configuration screen
│   ├── Dialog.tsx                  # Dialog component
│   └── Field.tsx                   # Field extension component
└── setupTests.ts                   # Test setup configuration
```

## API Reference

### CDAService

The `CDAService` class provides methods to interact with the Content Delivery API:

```typescript
const cdaService = new CDAService(spaceId, environmentId, accessToken);

// Get a single entry
const entry = await cdaService.getEntry(entryId, locale);

// Get entry with content type information
const { entry, contentType } = await cdaService.getEntryWithContentType(entryId, locale);

// Get multiple entries
const entries = await cdaService.getEntries(contentTypeId, locale, limit);

// Get content type information
const contentType = await cdaService.getContentType(contentTypeId);

// Check if a field is a rich text field
const isRichText = cdaService.isRichTextField(fieldId, contentType);

// Validate CDA connection
const { valid, message } = await cdaService.validateConnection();
```

### PublishedEntryViewer Component

Props:
- `entryId`: The ID of the entry to fetch
- `spaceId`: The Contentful space ID
- `environmentId`: The environment ID
- `accessToken`: The CDA access token
- `locale`: The locale to fetch (defaults to 'en-US')

### Rich Text Conversion

The app uses `@contentful/rich-text-html-renderer` to convert rich text documents:

```typescript
import { documentToHtmlString } from '@contentful/rich-text-html-renderer';

// Convert rich text document to HTML
const htmlString = documentToHtmlString(richTextDocument);
```

### Entry Publication Status

The app checks entry publication status:

```typescript
const isEntryPublished = (entry: CDAEntry): boolean => {
  return entry.sys.publishedAt !== null && entry.sys.publishedAt !== undefined;
};
```

## Dependencies

- `@contentful/rich-text-html-renderer`: For converting rich text to HTML
- `@contentful/f36-components`: For UI components
- `@contentful/app-sdk`: For Contentful app SDK
- `@contentful/react-apps-toolkit`: For React app utilities

## Security Considerations

- Never commit your CDA token to version control
- Use environment variables for sensitive configuration
- The CDA token should have read-only permissions for security
- Consider implementing token rotation for production use

## Troubleshooting

### Common Issues

1. **"CDA token not configured" warning**:
   - Ensure `REACT_APP_CDA_TOKEN` is set in your environment
   - Restart the development server after setting the variable

2. **"Unable to connect to Content Delivery API" error**:
   - Check your CDA token permissions
   - Verify space and environment IDs are correct
   - Ensure the token has access to the specified environment

3. **"Environment not found" error**:
   - Verify the environment ID is correct
   - Check that the environment exists in your space
   - Ensure your token has access to the environment

4. **"Entry not found" error**:
   - Verify the entry ID is correct
   - Check that the entry exists in the specified environment
   - Ensure the entry has been published

5. **"Entry is not published" message**:
   - This is expected behavior for draft entries
   - Publish the entry in Contentful to view published data
   - Use the "Check Again" button to refresh after publishing

6. **Rich text conversion errors**:
   - Ensure the rich text field contains valid document structure
   - Check that the content type is properly configured
   - Verify the field is published

7. **Authentication errors (401/403)**:
   - Check your CDA token is valid and not expired
   - Verify the token has the correct permissions
   - Ensure the token has access to the specified space and environment

8. **CORS issues**:
   - The CDA calls are made from the browser, so CORS should not be an issue
   - If you encounter CORS problems, check your Contentful space settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## License

This project is licensed under the MIT License.
