# Contentful Klaviyo Integration App

This Contentful app enables seamless integration between Contentful and Klaviyo, allowing marketers to sync approved content and media directly from Contentful to Klaviyo's campaign building tools. This eliminates copy/paste workflows and ensures consistent, up-to-date content across marketing channels.

## Features

- **Content Synchronization**: Sync text content, rich text, and references from Contentful to Klaviyo
- **Media Asset Integration**: Send Contentful images and assets directly to Klaviyo
- **Field Mapping**: Configure custom mappings between Contentful fields and Klaviyo blocks
- **Reference Resolution**: Automatically resolve and format Contentful entry references
- **Rich Text Support**: Convert Contentful rich text to formatted HTML for Klaviyo

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)
- Contentful account with admin access
- Klaviyo account with API access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/contentful/marketplace-partner-apps.git
cd marketplace-partner-apps/apps/klaviyo
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```
CONTENTFUL_APP_ID=your-app-id
CONTENTFUL_APP_DEF_ID=your-app-definition-id
CONTENTFUL_ORG_ID=your-org-id
CONTENTFUL_ACCESS_TOKEN=your-access-token
CONTENTFUL_APP_HOST=http://localhost:3000
```

4. Create a `.env` file for the proxy server with:
```
KLAVIYO_API_KEY=your-klaviyo-api-key
CONTENTFUL_APP_HOST=http://localhost:3000
PORT=3001
```

### Development

To start the app in development mode with the proxy server:

```bash
npm run dev-with-proxy
```

This will:
1. Start the Contentful app on port 3000
2. Start the Klaviyo proxy server on port 3001
3. Configure the app to communicate with the proxy server

For local development, you'll need to configure your Contentful app to use `http://localhost:3000`.

### Building for Production

Build the app for production:

```bash
npm run build
```

### Deployment

To deploy the app to Contentful:

```bash
npm run upload
```

The command will guide you through the deployment process and ask for required arguments.

For CI/CD pipelines, use:

```bash
npm run upload-ci
```

This requires the environment variables mentioned in the Installation section.

## Proxy Server

The app includes a proxy server (in `server.js`) that handles communication with the Klaviyo API. This proxy is necessary because Klaviyo's API doesn't support direct browser requests due to CORS restrictions. The proxy server securely forwards requests to Klaviyo and returns the responses to the app.

### API Key Handling

The Klaviyo API key is handled in one of two ways:

1. **Environment Variable (Recommended for Production)**: The proxy server can read the Klaviyo API key from the `KLAVIYO_API_KEY` environment variable. This is the most secure option for production environments.

2. **Request Parameter**: The app passes the Klaviyo API key from Contentful's installation parameters to the proxy server with each request. This allows the app to work without storing the API key in environment variables.

The flow works as follows:
- User enters the Klaviyo API key in the Contentful app's configuration screen
- Contentful stores this key securely in the app's installation parameters
- When the app needs to call the Klaviyo API, it:
  - Retrieves the API key from the installation parameters
  - Sends it along with the request to the proxy server
  - The proxy server uses this key to authenticate with Klaviyo

This approach means that even if you don't set the `KLAVIYO_API_KEY` environment variable, the app will still work by passing the key securely through the proxy server.

### Running the Proxy

To run the proxy server separately:

```bash
npm run proxy
```

Configure the server using environment variables:
- `KLAVIYO_API_KEY`: Your Klaviyo API key (optional if passing in requests)
- `CONTENTFUL_APP_HOST`: The host where your Contentful app is running
- `PORT`: The port for the proxy server (default: 3001)

## App Locations

This app provides the following integration points in Contentful:

- **App Configuration Screen**: Configure API keys and global settings
- **Entry Sidebar**: Map fields and sync content to Klaviyo
- **Entry Field**: Automatic content processing with the `onEntryUpdate` function

## Testing

Run tests:

```bash
npm test
```

## Learn More

- [Contentful App Framework](https://www.contentful.com/developers/docs/extensibility/app-framework/)
- [Klaviyo API Documentation](https://developers.klaviyo.com/en/reference)
- [Contentful Management API](https://www.contentful.com/developers/docs/references/content-management-api/)
