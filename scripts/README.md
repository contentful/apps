# Contentful Space Setup Script

This script automates the complete setup of Contentful spaces for your app, including app definition creation, space creation, team assignments, and app installations.

## What This Script Does

1. **Creates App Definitions** (staging and production) in your Contentful organization
2. **Creates Two Spaces**: Production and Staging environments
3. **Assigns Teams** to both spaces with admin privileges
4. **Installs the App** in both spaces
5. **Provides Configuration Links** to finish app setup

## ⚙️ Configuration

### Environment Variables Setup

1. **Copy the example environment file:**

   ```bash
   cp .env-example .env
   ```

2. **Fill in your Contentful credentials in `.env`:**
   ```bash
   CONTENTFUL_ACCESS_TOKEN=your_access_token_here
   CONTENTFUL_ORGANIZATION_ID=your_org_id_here
   CONTENTFUL_TEAM_ID=your_team_id_here
   CONTENTFUL_APP_NAME=Your App Name
   CONTENTFUL_ENVIRONMENT=master
   ```

### 🔑 How to Get Required IDs

#### Access Token (Content Management API)

1. Go to [Contentful Web App](https://app.contentful.com)
2. Navigate to Settings → API keys → Content management tokens
3. Generate a new personal access token
4. Copy the token to `CONTENTFUL_ACCESS_TOKEN` in your `.env` file

#### Organization ID

1. In Contentful, go to your organization settings
2. The organization ID is in the URL: `app.contentful.com/account/organizations/{ORGANIZATION_ID}`
3. Copy this ID to `CONTENTFUL_ORGANIZATION_ID` in your `.env` file

#### Team ID

1. Go to Settings → Teams
2. Click on the team you want to assign
3. The team ID is in the URL: `app.contentful.com/account/organizations/{ORG_ID}/teams/{TEAM_ID}`
4. Copy this ID to `CONTENTFUL_TEAM_ID` in your `.env` file

## How to Run

1. **Navigate to the scripts directory:**

   ```bash
   cd scripts
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure your `.env` file** (see Configuration section above)

4. **Run the setup script:**
   ```bash
   npm run setup
   ```

## What Gets Created

### App Definitions

- **Staging**: `{appName} (staging)`
- **Production**: `{appName} (production)`
- **Location**: Your Contentful organization
- **Status**: Created but needs configuration

### Spaces

- **Production**: `{appName} (production)`
- **Staging**: `{appName} (staging)`
- **Team Access**: Admin privileges for specified team
- **App Installation**: Your app installed in both spaces

## 📝 Next Steps

After running the script successfully:

1. **Configure your app definitions** using the provided links
2. **Set up app locations** (entry field, page, etc.)
3. **Configure app parameters** if needed
