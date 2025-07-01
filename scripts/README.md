# Contentful Space Setup Script

This script automates the complete setup of Contentful spaces for your app, including app definition creation, space creation, team assignments, and app installations.

## What This Script Does

1. **Creates an App Definition** in your Contentful organization
2. **Creates Two Spaces**: Production and Staging environments
3. **Assigns Teams** to both spaces with admin privileges
4. **Installs the App** in both spaces
5. **Provides Configuration Link** to finish app setup


## ⚙️ Configuration

Before running the script, update these variables in `scripts/scripts.js`:

```javascript
const accessToken = 'YOUR_CONTENTFUL_ACCESS_TOKEN';
const organizationId = 'YOUR_ORGANIZATION_ID';
const appName = 'Your App Name';
const teamId = 'YOUR_TEAM_ID'; 
const environmentId = 'master'; 
```

### 🔑 How to Get Required IDs

#### Access Token
1. Go to [Contentful Web App](https://app.contentful.com)
2. Navigate to Settings → API keys → Content management tokens
3. Generate a new personal access token

#### Organization ID
1. In Contentful, go to your organization settings
2. The organization ID is in the URL: `app.contentful.com/account/organizations/{ORGANIZATION_ID}`

#### Team ID
1. Go to Settings → Teams
2. Click on the team you want to assign
3. The team ID is in the URL: `app.contentful.com/account/organizations/{ORG_ID}/teams/{TEAM_ID}`

## How to Run

1. **Navigate to the scripts directory:**
   ```bash
   cd scripts
   ```

2. **Install dependencies** (if not already installed):
   ```bash
   npm install contentful-management
   ```

3. **Configure the script** with your values (see Configuration section above)

4. **Run the script:**
   ```bash
   node scripts.js
   ```

## What Gets Created

### App Definition
- **Name**: `{appName}`
- **Location**: Your Contentful organization
- **Status**: Created but needs configuration

### Spaces
- **Production**: `{appName} (production)`
- **Staging**: `{appName} (staging)`
- **Team Access**: Admin privileges for specified team
- **App Installation**: Your app installed in both spaces


## 📝 Next Steps

After running the script successfully:

1. **Configure your app definition** using the provided link
2. **Set up app locations** (entry field, page, etc.)
3. **Configure app parameters** if needed

