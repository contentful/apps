# Klaviyo Integration App

This Contentful app integrates with Klaviyo's marketing automation platform to allow content editors to send data to Klaviyo directly from Contentful.

## Architecture

The app uses Contentful's App Framework with two main components:

1. **Frontend**: A React application that runs in the Contentful web interface
2. **App Functions**: Serverless functions that handle communication with the Klaviyo API

The frontend app communicates with the App Functions, which serve as a secure proxy to the Klaviyo API. This approach keeps your Klaviyo credentials secure.

## Features

- OAuth-based authentication with Klaviyo
- Send tracking events to Klaviyo
- Create and identify profiles in Klaviyo
- Upload template content to Klaviyo

## Setup

### Prerequisites

- Klaviyo account with API access
- Contentful organization with app hosting capabilities

### Installation

1. Install the app in your Contentful space

2. Connect your Klaviyo account via OAuth during app configuration

## Usage

### Authentication & Security

The app uses OAuth authentication with Klaviyo:

1. **OAuth Authentication**: The app uses Klaviyo's OAuth flow for secure access to your Klaviyo account.

2. **Secure Connection**: During app configuration, users connect their Klaviyo account via OAuth. This process:
   - Redirects users to Klaviyo's authorization page
   - Requests necessary permissions for the app to access Klaviyo data
   - Securely stores access tokens for API communication
   - Never exposes credentials to users or stores them in plain text

The authentication process works as follows:
- OAuth credentials are securely stored in Contentful's app parameters
- The App Functions use OAuth tokens to authenticate with Klaviyo
- All API requests are proxied through the App Functions, keeping credentials secure
- Tokens are automatically refreshed as needed

### API Communication

All API requests to Klaviyo are proxied through the App Functions to ensure security:

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


### Development

To start the app in development mode:

```bash
npm run dev
```

For local development, you'll need to configure your Contentful app to use `http://localhost:3000`.

### Building for Production

Build the app for production:

```bash
npm run build
```

This will build both the frontend and the App Functions.

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

## App Functions

The app includes several App Functions that handle communication with the Klaviyo API:

- **Klaviyo Entry Sync**: Automatically syncs content to Klaviyo when entries are published or updated
- **Proxy Request**: Proxies requests to allowed Klaviyo endpoints
- **OAuth Functions**: Handle the OAuth authentication flow (initiate, complete, disconnect, check status)

These functions are necessary because Klaviyo's API doesn't support direct browser requests due to CORS restrictions. The functions securely forward requests to Klaviyo using OAuth tokens and return the responses to the app.

## App Locations

This app provides the following integration points in Contentful:

- **App Configuration Screen**: Connect your Klaviyo account via OAuth and configure global settings
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
