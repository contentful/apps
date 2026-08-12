# Entry Exporter for Contentful

A Contentful App that allows you to export unlimited entries from any content type to **5 different formats** (CSV, JSON, XLSX, XML, YAML), bypassing the 40-entry limitation of the Contentful web interface.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

## Features

### Export Formats
- **5 Export Formats**: CSV, JSON, XLSX (Excel), XML, YAML
- **Quick Export Dropdown**: One-click export with smart defaults (all locales, all fields)
- **Advanced Export**: Full control via Output tab (custom locales, fields, filename)
- **Format-Specific Optimizations**: UTF-8 BOM for CSV/Excel, pretty-printed JSON, compressed XLSX

### Search & Filtering
- **Contentful-Style Results Table**: Search results display matches Contentful's native interface with:
  - Entry name (using the content type's display field)
  - Content type name (human-readable, not ID)
  - Updated date (YYYY-MM-DD format)
  - Last updated by (user's full name)
  - Status (draft/changed/published)
- **Global Search**: Search across all content types or filter by specific content type
- **Select Entries**: Check individual entries or select all, then export only your selection
- **Rich Filtering**:
  - Full-text search across all fields
  - Status filters (published, draft, changed, archived)
  - Date range filters (created and updated dates)
  - Tag filters (any or all tags)
  - Taxonomy concept filters (any or all concepts)
  - Advanced field-level filters with multiple operators

### Export Capabilities
- **Unlimited Entries**: Export any number of entries from any content type
- **Smart Field Selection**: Auto-selects the title and key fields when you pick a content type
- **One-Click Presets**: Essentials, Content, References, All, Clear
- **Reorderable Columns**: Use up/down arrows to set the exact column order in your export
- **Field Search**: Filter long field lists by name or ID
- **Per-User Preferences**: Field selection, format, and filename are saved in your browser via `localStorage` so each user keeps their own settings
- **Locale Selection**: Export all locales or select specific ones
- **Clean Output**: Human-readable column headers and formatted data
- **Rate-Limit Aware**: Automatic throttling (8 req/s for paid tier) and retry logic
- **Real-Time Progress**: Track export progress with cancel support
- **Contextual Help**: Tooltips on every control explaining features

## Quick Start

### Local Development

1. **Clone the repository**
```bash
git clone https://github.com/contentful/apps.git
cd apps/apps/bulk-exporter
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

4. **Configure in Contentful**
   - Go to **Settings** > **Apps** > **Manage apps** > **Create app**
   - Choose **App hosted by you**
   - Set the app URL to `http://localhost:3000`
   - Enable these locations:
     - **App configuration screen**
     - **Page**
   - Save and install the app to your space

### Deploy to Production

#### Upload to Contentful (Hosted by Contentful)

Contentful can host your app directly.

**Requirements:**
- Max bundle size: 10MB (this app is ~1.6MB)
- Max files: 500 (this app has 2 files)
- Must include `index.html` at the root level

**Manual Upload:**

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Open your app in Contentful**
   - Go to your app definition in the Contentful web app
   - Click to open the app details

3. **Upload the bundle**
   - Click on the **"Bundles"** tab
   - **Select BOTH files** from your `dist/` folder:
     - `index.html`
     - `bundle.js`
   - **Drag and drop these 2 files** directly into the drop zone
   - Add a comment when prompted (e.g., "Production release v1.0")

4. **Activate the bundle**
   - After upload completes, click **"Activate"** next to your newly created bundle

**CLI Upload:**

```bash
npm run deploy -- --organization-id YOUR_ORG_ID --definition-id YOUR_APP_DEF_ID --token YOUR_CMA_TOKEN
```

**Finding your IDs:**
- **Organization ID**: Found in your Contentful organization settings URL
- **App Definition ID**: Found in your app's URL in Contentful
- **CMA Token**: Create one at https://app.contentful.com/account/profile/cma_tokens

**Troubleshooting:**
- If the app doesn't load, ensure `index.html` is at the root level (not in a subfolder)
- The build must use relative paths (already configured with `base: './'` in `vite.config.ts`)

## Usage

### Two Ways to Export

**Quick Export (Casual Users)**
1. Set your filters in the Filter tab
2. Click the **Export** dropdown button
3. Select your format (CSV, JSON, XLSX, XML, or YAML)
4. Done! File downloads with smart defaults

**Advanced Export (Power Users)**
1. Configure filters in Filter tab
2. Add field-level filters in Advanced tab (optional)
3. Go to **Output tab** to customize:
   - Export format
   - Specific locales
   - Specific fields
   - Custom filename
4. Click **Export** dropdown → **Advanced (use Output tab)**

### Search & Preview

1. Navigate to **Apps** in the Contentful web UI main menu
2. Select **Entry Exporter**
3. Use the tabbed interface to build your query:

#### Filter Tab
- Select a content type (or "Any" for global search)
- Enter full-text search terms
- Choose status (any, published, draft, changed, archived)
- Set created/updated date ranges
- Select sort order

#### Tags & Taxonomy Tab
- Select tags (match any or all)
- Select taxonomy concepts (match any or all)

#### Advanced Tab
- Add field-level filters with operators (equals, not equals, exists, contains, etc.)
- Add multiple filters for complex queries

#### Output Tab
- Select which locales to include in the export
- **Choose specific fields** to export (leave empty for all fields)
- Preview the filename

4. Click **Search & Preview** to see matching entries in a table
5. **Use checkboxes** to select specific entries you want to export
   - Check individual rows
   - Use "Select All" to select all visible results
   - Click "Export Selected" button to export only checked entries
6. Click **Estimate Count** to see the total number of matching entries
7. Click **Export** to download all matching entries

## Export Formats

All 5 formats use clean, human-readable formatting with **consistent data structure** across all export methods (quick export, advanced export, or selected entries).

### Available Formats

| Format | Best For | File Extension |
|--------|----------|----------------|
| **CSV** | Excel, Google Sheets, data analysis | `.csv` |
| **JSON** | APIs, web applications, JavaScript | `.json` |
| **XLSX** | Microsoft Excel, formatted spreadsheets | `.xlsx` |
| **XML** | Enterprise systems, SOAP APIs, legacy integrations | `.xml` |
| **YAML** | Configuration files, DevOps, CI/CD pipelines | `.yaml` |

### CSV Format Details

#### Column Headers
- **Entry ID**: Unique identifier for the entry
- **Created**: Entry creation date (YYYY-MM-DD)
- **Updated**: Last update date (YYYY-MM-DD)
- **Last Updated By**: Full name of the user who last updated the entry
- **Status**: "Draft" or "Published"
- **Content Type**: Human-readable content type name
- **Field columns**: Use field names from your content model (e.g., "Title (en-US)", "Author")

#### Data Formatting (CSV)
- **References**: Just the entry/asset ID (e.g., `abc123`)
- **Arrays**: Semicolon-separated values (e.g., `tech; blog; tips`)
- **Dates**: YYYY-MM-DD format
- **Rich Text**: Plain text extraction when possible
- **Objects**: JSON strings for complex data
- **User Names**: Resolved to full names instead of IDs

### Format-Specific Features

**JSON**
- Pretty-printed with 2-space indentation
- Array of objects, one per entry
- Native data types preserved (strings, numbers, booleans)

**XLSX (Excel)**
- Auto-sized columns based on content
- Compression enabled for smaller file sizes
- Single worksheet named "Entries"
- Opens directly in Microsoft Excel

**XML**
- Structured with proper XML declaration
- Root element: `<entries>`
- Each entry in `<entry>` element with field sub-elements
- Field names converted to valid XML element names

**YAML**
- Human-readable with 2-space indentation
- 120-character line width
- Array of objects format
- Perfect for configuration management

**Example CSV output:**
```csv
Entry ID,Created,Updated,Last Updated By,Status,Content Type,Title (en-US),Author,Tags
abc123,2024-01-01,2024-01-02,Jane Smith,Published,Blog Post,Hello World,author456,tech; blog; tips
```

## Rate Limits

Contentful enforces API rate limits:

- **Free tier**: ~7 requests per second
- **Paid tiers**: ~10 requests per second

This app is configured for paid tier usage and automatically throttles requests to ~8 req/s. It handles `429` responses by:

1. Reading the `X-Contentful-RateLimit-Reset` header (seconds to wait)
2. Applying exponential backoff if the header is missing
3. Retrying up to 3 times before failing

Large exports may take several minutes. Progress is shown in real-time.

## How It Works

The Contentful web UI limits CSV exports to 40 entries. This app uses the Content Management API directly to:

1. **Search & Preview**: Build your query using the search form and preview matching entries in a paginated list
2. **Paginate Efficiently**: Fetch entries at 1000 per page using `skip`/`limit`, then switch to cursor-based pagination (`sys.createdAt[gt]`) after 9000 entries
3. **Respect Rate Limits**: Throttle requests to ~8 req/s (paid tier) with 4 concurrent in-flight requests
4. **Retry on Failures**: Automatically retry on `429` responses with exponential backoff (max 3 retries), respecting `X-Contentful-RateLimit-Reset` header
5. **Flatten Complex Data**: Transform all entry fields (including localized fields, references, rich text, and arrays) into flat rows with clean formatting

## Technical Details

### Tech Stack

- **Framework**: React 18 + TypeScript + Vite
- **UI**: Forma 36 (Contentful's design system)
- **SDK**: Contentful App SDK + React Apps Toolkit
- **CSV**: PapaParse for serialization
- **Excel**: ExcelJS for XLSX generation
- **Testing**: Vitest + React Testing Library

### Project Structure

```
src/
  index.tsx                 # App entry point, location router
  locations/
    ConfigScreen.tsx        # App configuration screen
    Page.tsx                # Main export UI
  components/
    ExportForm.tsx          # Search form with filters
    ProgressPanel.tsx       # Progress bar and status
    ResultsList.tsx         # Search results table
  lib/
    throttle.ts             # Token bucket + 429 retry logic
    paginate.ts             # CMA pagination (skip + cursor)
    flatten.ts              # Entry → flat row transformation
    csv.ts                  # PapaParse wrapper
    exporter.ts             # Main orchestrator
    queryBuilder.ts         # Filter query builder
  lib/__tests__/            # Unit tests
```

### Key Implementation Details

**Throttling (`lib/throttle.ts`)**

- Token bucket algorithm at ~8 req/s (configured for paid tier)
- Concurrency limited to 4 simultaneous requests
- Automatically retries `429` responses
- Respects `X-Contentful-RateLimit-Reset` header

**Pagination (`lib/paginate.ts`)**

- Uses `skip`/`limit` for the first 9000 entries
- Switches to `sys.createdAt[gt]` cursor pagination beyond 9000
- Async generator for memory-efficient streaming

**Flattening (`lib/flatten.ts`)**

- Creates readable column headers ("Title (en-US)" instead of "title.en-US")
- Formats references as IDs only (cleaner than "Link:Entry:ID")
- Extracts plain text from rich text when possible
- Semicolon-separates arrays for better CSV readability

## Development

### Prerequisites

- Node.js 18+ and npm
- A Contentful space with appropriate permissions

### Setup

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test

# Run tests with UI
npm run test:ui

# Type check
npm run type-check

# Build for production
npm run build
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Troubleshooting

**Export fails with "Failed to load content types"**

- Ensure the app has the correct permissions in your space
- Check that you're logged in to Contentful

**Export is very slow**

- Large exports with 10,000+ entries can take several minutes
- Rate limits are enforced; the app will throttle automatically
- Consider filtering by date range to reduce the export size

**CSV doesn't open correctly in Excel**

- The CSV includes a UTF-8 BOM for Excel compatibility
- Try opening with "Import Data" instead of double-clicking
- Alternatively, use Google Sheets which handles UTF-8 CSVs natively

**"Too many requests" errors**

- The app automatically handles `429` responses
- If you see this error, wait a minute and try again
- You may be running other API-heavy operations simultaneously

**Search results show IDs instead of names**

- Hard refresh your browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
- This clears the cached version and loads the latest code

## License

MIT
