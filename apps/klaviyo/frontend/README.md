# Klaviyo Integration App

This Contentful app integrates with Klaviyo's marketing automation platform to allow content editors to send data to Klaviyo directly from Contentful.

## Architecture

The app uses a serverless architecture with two main components:

1. **Frontend**: A React application that runs in the Contentful web interface
2. **Lambda Function**: A serverless AWS Lambda function that handles communication with the Klaviyo API

The frontend app communicates with the Lambda function, which serves as a secure proxy to the Klaviyo API. This approach keeps your Klaviyo credentials secure.

## Features

- API key-based authentication with Klaviyo
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
2. Obtain your Klaviyo API keys from your Klaviyo account:
   - Public API Key (starts with pk_)
   - Private API Key (starts with pk_)

3. Install the app in your Contentful space
4. Configure the app with:
   - Lambda API URL
   - Klaviyo Public API Key
   - Klaviyo Private API Key (securely stored)

## Usage

### Authentication & Security

The app uses API key authentication with Klaviyo:

1. **API Key Authentication**: The app uses Klaviyo's API key authentication for secure access.

2. **Secure Credentials**: During app installation, users provide their Klaviyo Public and Private API keys, which are securely stored in Contentful's app parameters.

The authentication process works as follows:
- API keys are securely stored in Contentful's app parameters
- The Lambda function uses these keys to authenticate with Klaviyo
- All API requests are proxied through the Lambda function, keeping credentials secure

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
