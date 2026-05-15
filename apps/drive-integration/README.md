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
