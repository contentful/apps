# Klaviyo Integration App

This Contentful app integrates with Klaviyo's marketing automation platform to allow content editors to send data to Klaviyo directly from Contentful.

## Architecture

The app uses a serverless architecture with two main components:

1. **Frontend**: A React application that runs in the Contentful web interface
2. **Lambda Function**: A serverless AWS Lambda function that handles communication with the Klaviyo API

The frontend app communicates with the Lambda function, which serves as a secure proxy to the Klaviyo API. This approach keeps your Klaviyo credentials secure and handles the OAuth authentication flow.

## Features

- OAuth 2.0 authentication with Klaviyo
- Send tracking events to Klaviyo
- Create and identify profiles in Klaviyo
- Upload template content to Klaviyo

## Setup

### Prerequisites

- Klaviyo account with API access
- AWS account for Lambda deployment
- Contentful organization with app hosting capabilities

### Installation

1. Deploy the Lambda function to AWS (see the `lambda` directory for deployment instructions)
2. Configure your Klaviyo OAuth application:
   - Set the redirect URI to your Lambda's `/auth/callback` endpoint
   - Note your Client ID and Client Secret

3. Install the app in your Contentful space
4. Configure the app with:
   - Lambda API URL
   - Klaviyo Client ID
   - Klaviyo Client Secret (securely stored)

## Usage

### Authentication & Security

The app uses OAuth 2.0 with PKCE (Proof Key for Code Exchange) for secure authentication with Klaviyo, eliminating the need for API keys:

1. **OAuth 2.0 Flow**: Instead of API keys, the app implements a full OAuth 2.0 authorization flow with PKCE for enhanced security.

2. **Client Credentials**: During app installation, users provide their Klaviyo Client ID and Client Secret, which are securely stored in Contentful's app parameters.

The authentication flow works as follows:
- User initiates the connection to Klaviyo through the app's configuration screen
- The app generates a PKCE code verifier and challenge for the OAuth flow
- User is redirected to Klaviyo's authorization page and grants access
- Klaviyo redirects back to the Lambda function's callback endpoint with an authorization code
- The Lambda function handles the server-side token exchange with Klaviyo
- Access tokens are securely handled and used for all subsequent API requests
- The Lambda function serves as a proxy, keeping credentials and tokens secure

This OAuth implementation provides several security advantages:
- No long-lived API keys stored in browser or source code
- Support for token refresh without user intervention
- Ability to revoke access when needed
- Granular permission scopes for Klaviyo API access

### API Communication

All API requests to Klaviyo are proxied through the Lambda function to ensure security:

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

To start the app in development mode with the proxy server:

```bash
npm run dev-with-proxy
```

This will:
1. Start the Contentful app on port 3000
2. Start the lambda proxy on port 3001
3. Configure the app to communicate with the proxy

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

## Proxy

The app includes a proxy that handles communication with the Klaviyo API. This proxy is necessary because Klaviyo's API doesn't support direct browser requests due to CORS restrictions. The proxy server securely forwards requests to Klaviyo and returns the responses to the app.


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
