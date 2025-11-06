# Richard Brandson - Setup Guide

## Quick Setup (First Time Installation)

Follow these steps to set up the app for the first time:

### Step 1: Create App Definition

Run this command to create an app definition in Contentful:

```bash
cd /Users/ben.golden/repos/apps/apps/richard-brandson
npm run create-app-definition
```

You'll be prompted for:
1. **Space ID**: Your Contentful space ID
2. **Environment**: Usually `master` or `main`
3. **App Name**: "Richard Brandson" (or your preferred name)
4. **App Description**: "AI-powered brand guidelines generator"

This will:
- Create an app definition in Contentful
- Save configuration to `.env` file
- Make the app available in your space

### Step 2: Start Development Server

```bash
npm start
```

This will start the app on `http://localhost:3000`

### Step 3: Install the App in Your Space

1. Go to **app.contentful.com**
2. Select your space
3. Click **Apps** in the top navigation
4. Click **Manage apps**
5. Find **Richard Brandson** in the list
6. Click **Install**
7. You'll be prompted to enter your **GitHub Personal Access Token**
8. Get a token from: https://github.com/settings/tokens
   - Create a **Fine-grained token** or **Classic token**
   - Required scope: **`models:read`**
9. Paste the token and click **Install**

### Step 4: Access the App

1. In Contentful, click **Apps** in the top navigation
2. Click **Richard Brandson**
3. The app should load!

## Troubleshooting Setup

### Error: "Unable to access app configuration"

This means the app isn't properly installed. Try these steps:

#### Option A: Check if app is installed
1. Go to Contentful → Settings → Apps
2. Look for "Richard Brandson"
3. If it's not there or says "Not installed", install it
4. If it's there, try uninstalling and reinstalling

#### Option B: Recreate app definition
```bash
# Delete existing app definition (if any)
rm .env

# Create fresh app definition
npm run create-app-definition
```

#### Option C: Manual setup via Contentful UI

If `npm run create-app-definition` doesn't work:

1. Go to **Organization settings** → **Apps** → **Create app**
2. Fill in:
   - **Name**: Richard Brandson
   - **URL**: `http://localhost:3000` (for development)
3. Click **Create**
4. Configure **App locations**:
   - Enable **App configuration screen**
   - Enable **Page**
5. Install the app in your space

### Error: Console shows specific error message

Check the browser console (F12) for the actual error. Look for:
```
Error getting parameters: ...
Error details: ...
```

Share this error message for more specific help.

### The app loads but shows "Configuration Required" warning

This is normal! It means:
- ✅ App is installed correctly
- ❌ You haven't configured your GitHub token yet

**Solution:**
1. Click the link in the warning message, OR
2. Go to Contentful → Settings → Apps → Richard Brandson → Configure
3. Enter your GitHub Personal Access Token
4. Save

## Getting a GitHub Personal Access Token

### Quick Steps:

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"**
3. Choose **"Generate new token (classic)"**
4. Settings:
   - **Note**: "Contentful Richard Brandson App"
   - **Expiration**: Choose your preferred duration
   - **Scopes**: Check **`repo`** (this includes models:read)
   - Or create a fine-grained token with just `models:read`
5. Click **"Generate token"**
6. **Copy the token immediately** (you won't see it again!)
7. Paste into Contentful app configuration

### Alternative: Fine-grained Token (Recommended)

1. Go to https://github.com/settings/tokens?type=beta
2. Click **"Generate new token"**
3. Settings:
   - **Token name**: "Contentful Richard Brandson"
   - **Expiration**: Choose duration
   - **Repository access**: "Public Repositories (read-only)" is sufficient
   - **Permissions**: 
     - Repository permissions → scroll down
     - Enable "Read access to models" (if available)
4. Click **"Generate token"**
5. Copy and paste into Contentful

## Verifying Setup

Once setup is complete:

1. ✅ App appears in Contentful Apps menu
2. ✅ App loads without errors
3. ✅ You see "AI-Powered Brand Guidelines Generator" heading
4. ✅ Configuration warning doesn't appear (or you've configured it)
5. ✅ "Generate Brand Guidelines PDF" button is enabled

## Development Workflow

### Daily Development:

```bash
# Start dev server
npm start

# Access through Contentful
# Go to: app.contentful.com → Your Space → Apps → Richard Brandson
```

### Testing Changes:

1. Make code changes
2. App hot-reloads automatically
3. Refresh Contentful page if needed
4. Check browser console for errors

### Building for Production:

```bash
# Build the app
npm run build

# Upload to Contentful hosting
npm run upload

# Follow prompts to deploy
```

## Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| App not in Apps menu | Not installed | Install via Settings → Apps |
| "Unable to access app configuration" | Not installed or no definition | Run `create-app-definition` |
| "Configuration Required" | No GitHub token | Configure the app |
| LocalhostWarning shows | Accessing localhost directly | Access via Contentful |
| Blank page | Build error | Check terminal for errors |
| API errors | Invalid token | Check token scopes |

## Next Steps

After successful setup:

1. **Configure the app**: Add your GitHub token
2. **Test PDF generation**: Generate a sample brand guidelines PDF
3. **Customize**: Modify the app to fit your needs
4. **Deploy**: Upload to Contentful when ready

## Need Help?

Check these files:
- `DEBUGGING.md` - Troubleshooting runtime errors
- `USAGE.md` - How to use the app
- `AI_FEATURES.md` - Technical details

Share console errors and screenshots for faster help!

