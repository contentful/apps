# CSV Import for Contentful

A self-contained, open-source Contentful app for importing entries from CSV files. Built with the Contentful App Framework, this app runs entirely in the browser with no external paid services.

## Features

- **Create and Update Modes**: Import new entries or update existing ones
- **Smart Column Mapping**: Automatic field detection with manual override options
- **Localization Support**: Map columns to specific locales for localized fields
- **Dry-Run Validation**: Validate data before import with detailed error reporting
- **Throttled Execution**: Rate-limited imports with retry logic for API errors
- **Progress Tracking**: Real-time progress updates with cancel support
- **Error Reporting**: Downloadable CSV of validation errors and import results
- **Template Generation**: Download pre-formatted CSV templates for any content type
- **Reference Support**: Import entry references by ID (single and arrays)
- **Array Support**: Handle array fields with configurable delimiters

## Supported Field Types (v1)

- **Symbol** (Text)
- **Text** (Long text)
- **RichText** (JSON pass-through)
- **Number**
- **Boolean** (accepts true/false, 1/0, yes/no)
- **Array** (Symbol and Link items)
- **Link** (Entry references by ID)

## Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start development server:
   ```bash
   npm start
   ```
4. Build for production:
   ```bash
   npm run build
   ```
5. Upload to Contentful:
   ```bash
   npm run upload
   ```

## Usage

### Basic Workflow

1. **Select Content Type**: Choose the content type you want to import
2. **Choose Mode**: Select "Create" for new entries or "Update" for existing entries
3. **Download Template** (optional): Generate a CSV template with all editable fields
4. **Upload CSV**: Upload your prepared CSV file
5. **Map Columns**: Map CSV columns to content type fields and select locales
6. **Dry Run**: Validate all data before making changes
7. **Execute**: Import entries with progress tracking
8. **Review Summary**: Download results and error reports

### CSV Format Conventions

#### Headers

- Use field IDs as column names (e.g., `title`, `description`, `slug`)
- For localized fields, use suffix notation: `fieldId__locale` (e.g., `title__en-US`)
- For update mode, include `sys.id` column with entry IDs

#### Data Values

**Text Fields**
```csv
title,description
"My Title","This is a description"
```

**Numbers**
```csv
price,quantity
19.99,100
```

**Booleans** (case-insensitive)
```csv
active,featured
true,1
false,no
yes,0
```

**Arrays** (default delimiter: `|`)
```csv
tags,categories
tag1|tag2|tag3,cat1|cat2
```

**References** (Entry IDs)
```csv
author,relatedPosts
abc123xyz,post1|post2|post3
```

**RichText** (JSON)
```csv
body
"{""nodeType"":""document"",""content"":[...]}"
```

#### Example: Create Mode

```csv
title,description,price,active,tags
"Product 1","Description 1",29.99,true,tag1|tag2
"Product 2","Description 2",39.99,false,tag3|tag4
```

#### Example: Update Mode

```csv
sys.id,title,price
entry123,"Updated Title",49.99
entry456,"Another Title",59.99
```

#### Example: Localized Fields

```csv
title__en-US,title__de-DE,description
"English Title","German Title","Shared description"
```

### Import Modes

#### Create Mode
- Creates new entries for each row
- All required fields must be present
- Respects content type validations (required, enum, regex, etc.)
- Optional: Publish entries after creation

#### Update Mode
- Updates existing entries
- Match by `sys.id` column OR natural key field
- Only mapped fields are updated (others remain unchanged)
- Optional: Publish entries after update

**Natural Key Matching** (alternative to sys.id):
- Configure a unique field (e.g., `sku`, `slug`) to match entries
- The natural key field must uniquely identify one entry
- If 0 or >1 matches found, the row will error in dry-run

### Validation

The dry-run step validates:

- **Required fields**: All required fields must have values (create mode)
- **Type checking**: Values must match field types (number, boolean, etc.)
- **Enums**: Values must be in allowed list (if configured)
- **Regex**: Values must match patterns (if configured)
- **Size/Range**: Values must be within min/max constraints
- **References**: Entry IDs must exist in the space
- **Update matching**: Entries must be found by sys.id or natural key

### Throttling and Retries

- **Concurrency**: 4 parallel requests (configurable)
- **Rate Limits**: Automatic retry with exponential backoff on 429 errors
- **Server Errors**: Retry up to 3 times on 5xx errors
- **Delay**: Initial 500ms, doubles on each retry

## Configuration

### Array Delimiters

Default: `|`

You can configure per-column delimiters in the mapping step. For example:
- Use `,` for comma-separated lists (be careful with CSV escaping)
- Use `;` for semicolon-separated lists
- Use any single character

### Locales

For localized fields, you can:
1. Use suffix notation in column names (`title__en-US`)
2. Select a target locale in the mapping UI
3. Mix both approaches in the same CSV

## Limitations (v1)

- **References**: Only supports entry IDs, not natural key lookup
- **Assets**: No asset upload or linking (v2 feature)
- **RichText**: No HTML-to-RTE transformation (pass JSON only)
- **Validation**: Basic validation only (no custom validators)
- **Bulk Operations**: No bulk publish/unpublish (individual only)
- **History**: No version control or rollback

## V2 Roadmap

- [ ] Reference lookup by natural key (not just ID)
- [ ] Asset upload by URL
- [ ] RichText HTML-to-RTE transformation
- [ ] Persist field mappings per content type
- [ ] Multi-locale columns in same CSV seamlessly
- [ ] Bulk publish with CMA bulk actions
- [ ] Entry archiving/unarchiving
- [ ] Scheduled imports
- [ ] Import from URL
- [ ] Export entries to CSV

## Architecture

### Tech Stack
- **React** + **TypeScript**
- **Vite** (build)
- **Vitest** + **React Testing Library** (testing)
- **Forma 36** (UI components)
- **Contentful App SDK** (CMA access)
- **PapaParse** (CSV parsing)
- **p-queue** (throttling)

### File Structure

```
src/
├── lib/
│   ├── types.ts          # TypeScript types
│   ├── utils.ts          # Utility functions
│   ├── csv.ts            # CSV parsing/generation
│   ├── mapping.ts        # Field mapping logic
│   ├── validation.ts     # Field validation
│   ├── references.ts     # Reference checking
│   └── importer.ts       # Import execution
├── hooks/
│   ├── useContentTypes.ts
│   ├── useLocales.ts
│   └── useEntriesSearch.ts
├── components/
│   ├── PageShell.tsx
│   ├── TypeSelector.tsx
│   ├── TemplateDownload.tsx
│   ├── MappingStep.tsx
│   ├── DryRunStep.tsx
│   ├── ExecuteStep.tsx
│   └── SummaryStep.tsx
└── locations/
    ├── Page.tsx          # Main app page
    └── Home.tsx          # App home card
```

## Development

### Run Tests
```bash
npm test
```

### Lint
```bash
npm run lint
```

### Build
```bash
npm run build
```

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- Focus management
- High contrast mode support
- Semantic HTML
- ARIA labels and roles

## Security

- No data sent to external services
- All processing in-browser
- Uses Contentful App SDK authenticated CMA
- Respects user permissions

## Support

For issues, questions, or feature requests, please open an issue on GitHub.

## License

MIT License - see LICENSE file for details.

## Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.
