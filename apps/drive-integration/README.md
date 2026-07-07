# Drive Integration App for Contentful

A Contentful App that enables importing content from Google Drive into Contentful entries.

## Frontend Setup

1. Clone the repository
2. Navigate to the app directory:

```bash
cd apps/drive-integration
```

3. Install dependencies:

```bash
npm install
```

4. Copy the example environment file and configure it:

```bash
cp .env.example .env
```

5. Edit `.env` and add your API keys and tokens

6. To run locally

```bash
npm run dev
```

Note: To run the backend locally follow the read me in the agents-api repo

### Local Agents API Development

By default, the app uses the production Agents API through the Contentful CMA SDK. To point the frontend at a locally running `agents-api`, set the local API base URL in `.env`:

```bash
VITE_LOCAL_AGENTS_API_BASE_URL=http://localhost:4111
```

When `VITE_LOCAL_AGENTS_API_BASE_URL` is set, agent run, generate, and resume requests are sent to that local endpoint. Leave it empty or unset to use the production CMA path.

Start the local `agents-api` service first, then run the frontend:

```bash
npm run dev
```

### Deployment

#### Development Environments

```bash
npm run deploy:dev      # Deploy to dev environment
npm run deploy:dev2     # Deploy to dev2 environment
npm run deploy:staging  # Deploy to staging environment
```

#### Production

```bash
npm run deploy:prod     # Deploy to production
```

**Note**: Deployment scripts require additional environment variables:

- `STATIC_S3_BASE` - S3 bucket base path for dev/staging
- `PROD_STATIC_S3_BASE` - S3 bucket base path for production
- `GOOGLE_DOCS_TEST_CLOUDFRONT_DIST_ID` - CloudFront distribution for dev/staging
- `GOOGLE_DOCS_PROD_CLOUDFRONT_DIST_ID` - CloudFront distribution for production

## Google OAuth Scopes

The app is registered as (Contentful Google Docs App). It requests the following OAuth scopes:

### Non-sensitive scopes

| Scope | Description | Justification |
|---|---|---|
| `https://www.googleapis.com/auth/drive.file` | See, edit, create, and delete only the specific Google Drive files you use with this app | Required for the Google Drive Picker to display the user's Google Docs files for selection. This scope limits access to only files the user explicitly opens with the app — it does not grant broad Drive access. |

### Sensitive scopes

| Scope | Description | Justification |
|---|---|---|
| `https://www.googleapis.com/auth/documents.readonly` | See all your Google Docs documents | Required to fetch the full document content via the Google Docs API (`docs.googleapis.com/v1/documents/{id}`) after the user selects a file. The `drive.file` scope alone is insufficient to read document body content for processing. This scope is the minimum necessary to retrieve the text, structure, and inline images needed to perform the import. |

### Restricted scopes

None.

### Notes

- No data from either scope is stored persistently. Document content is fetched transiently during an import operation and discarded after the Contentful entries are created.
- The OAuth token is used server-side in `agents-api` solely to call the Google Docs API. When processed via Inngest, the token travels exclusively in the KMS-encrypted `inputData` portion of the event payload and is stripped from the unencrypted `requestContext` before serialization.
- Users can revoke access at any time from the app configuration screen, which calls Google's OAuth token revocation endpoint.
