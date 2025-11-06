# Debugging Guide

## Error: "Cannot read properties of undefined (reading 'getParameters')"

### Quick Fix Applied

I've added error handling and debugging to the Page component. Here's what to check:

### 1. ✅ Are you running it correctly?

The Page location **must** be accessed through Contentful, not directly:

**❌ WRONG:**
```
http://localhost:3000
```

**✅ CORRECT:**
```bash
# Terminal 1: Start the dev server
cd /Users/ben.golden/repos/apps/apps/richard-brandson
npm start

# Then access through Contentful:
# 1. Go to app.contentful.com
# 2. Navigate to your space
# 3. Go to Apps → Richard Brandson
# 4. The app loads in an iframe from localhost:3000
```

### 2. 🔍 Check Browser Console

Open your browser's Developer Tools (F12) and look for debug logs:

```javascript
SDK object: {...}
SDK.app: {...}
SDK structure: [...]
Retrieved parameters: {...}
```

### 3. 🐛 What the Debug Logs Tell You

#### If you see:
```
SDK.app: undefined
```
**Problem**: The PageAppSDK type doesn't include the `app` property
**Fix**: Already applied - using `as any` type cast

#### If you see:
```
SDK.app: {}
Retrieved parameters: null
```
**Problem**: App not configured yet
**Solution**: Go to app configuration and add your GitHub token

#### If you see:
```
Error checking configuration: [some error]
```
**Problem**: The error message will tell you what's wrong

### 4. 📝 Changes Made

I've updated `Page.tsx` with:

1. **Error Handling**: Wrapped all `getParameters()` calls in try-catch
2. **SDK Validation**: Check if `sdk.app.getParameters` exists before calling
3. **Debug Logging**: Console logs to see SDK structure
4. **Initialization Delay**: 100ms delay to ensure SDK is ready
5. **Type Cast**: `as any` to work around TypeScript type limitations

### 5. 🔧 If It Still Doesn't Work

Try these steps:

#### Step A: Clear cache and restart
```bash
# Stop the dev server (Ctrl+C)
rm -rf node_modules/.vite
npm start
```

#### Step B: Check app installation
1. Go to Contentful → Settings → Apps
2. Find "Richard Brandson"
3. Check if it's properly installed
4. Try uninstalling and reinstalling

#### Step C: Create the app definition
```bash
cd /Users/ben.golden/repos/apps/apps/richard-brandson
npm run create-app-definition
```

Follow the prompts to set up the app properly.

### 6. 📊 Expected Console Output (Success)

When working correctly, you should see:
```javascript
SDK object: {ids: {…}, app: {…}, location: {…}, …}
SDK.app: {getParameters: ƒ, setReady: ƒ, onConfigure: ƒ, …}
SDK type: object
Retrieved parameters: {githubModelsApiKey: "github_pat_..."}
```

### 7. 🚨 Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| `sdk.app is undefined` | Wrong SDK type | Type cast added (already fixed) |
| `getParameters not a function` | SDK not initialized | Delay added (already fixed) |
| Opens LocalhostWarning | Running directly on localhost | Access through Contentful |
| Parameters are null | Not configured | Configure the app first |

### 8. 🎯 Next Steps After Fixing

Once the error is resolved:

1. **Configure the app**: Add your GitHub Personal Access Token
2. **Test PDF generation**: Click "Generate Brand Guidelines PDF"
3. **Check for API errors**: Monitor console for GitHub Models API issues

### 9. 📞 Still Having Issues?

Share the console output from the browser Developer Tools, specifically:
- The debug logs from checking configuration
- Any error stack traces
- The network tab showing any failed requests

## Development Workflow

### Recommended Development Process:

```bash
# 1. Start dev server
npm start

# 2. In Contentful:
#    - Go to Apps
#    - Click "Manage apps"
#    - Find your app
#    - Click "Hosted by you" or "Configure"
#    - Set URL to: http://localhost:3000

# 3. Access the app through Contentful UI
#    - Don't access localhost:3000 directly
#    - Navigate to Apps → Richard Brandson in Contentful

# 4. Watch console for logs
#    - F12 → Console tab
#    - Look for SDK debug output
```

### Hot Reload
The app should hot-reload when you make changes. If it doesn't:
- Refresh the Contentful page
- Check the terminal for build errors
- Try restarting the dev server

## Testing in Production

To test with the production build:

```bash
# Build the app
npm run build

# Upload to Contentful
npm run upload
```

Then access through Contentful without running a local server.

