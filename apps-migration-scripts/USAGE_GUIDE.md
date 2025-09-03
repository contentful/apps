# 🚀 Migration Scripts Usage Guide

A step-by-step guide for migrating apps from marketplace-partner-apps to the apps repository.

## 📋 Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Both repositories cloned side-by-side:**
  ```
  your-projects-folder/
  ├── apps/                          # This repository
  │   └── apps-migration-scripts/    # These migration scripts
  └── marketplace-partner-apps/      # Partner apps repository
  ```

- [ ] **Required tools installed:**
  - Node.js 16+ (`node --version`)
  - npm 8+ (`npm --version`)
  - Git (`git --version`)
  - jq (`jq --version`)

- [ ] **Repositories are up to date:**
  ```bash
  # In apps repository
  git pull origin master
  
  # In marketplace-partner-apps repository
  cd ../marketplace-partner-apps
  git pull origin main
  cd ../apps
  ```

- [ ] **You're in the apps-migration-scripts directory** (where the scripts are located)
  ```bash
  cd apps/apps-migration-scripts
  ```

## 🎯 Step-by-Step Migration Process

### Step 1: Choose Your App

First, see what apps are available to migrate:

```bash
# Quick summary of available scripts and apps
./migration-summary.sh

# Or list apps manually
ls ../../marketplace-partner-apps/apps/
```

### Step 2: Run a Dry-Run Migration

**Always start with a dry-run** to see what would happen:

```bash
./migrate-app.sh <app-name> --dry-run --verbose
```

**Example:**
```bash
./migrate-app.sh amplitude-experiment --dry-run --verbose
```

**What to look for:**
- ✅ No error messages
- ✅ Files are being copied correctly
- ✅ Package.json adaptations look reasonable
- ✅ Configuration files are being added appropriately

### Step 3: Perform the Actual Migration

If the dry-run looks good, run the real migration:

```bash
./migrate-app.sh <app-name>
```

**Example:**
```bash
./migrate-app.sh amplitude-experiment
```

**Expected output:**
```
=============================================================================
  Marketplace Partner Apps to Apps Repository Migration Script
=============================================================================

[INFO] Checking prerequisites...
[INFO] Prerequisites check passed
[INFO] Starting migration of app: amplitude-experiment
[INFO] Mode: LIVE
[INFO] App 'amplitude-experiment' found and validated
[INFO] Creating temporary workspace...
[INFO] Copying app files from marketplace-partner-apps...
[INFO] Adapting package.json for apps repository structure...
[INFO] Adding missing configuration files...
[INFO] Updating dependencies to match apps repository standards...
[INFO] Migrating app to apps repository...
[INFO] Running post-migration setup...
[INFO] Migration completed successfully!
```

### Step 4: Validate the Migration

Run comprehensive validation to ensure everything works:

```bash
./validate-migration.sh <app-name> --detailed
```

**Example:**
```bash
./validate-migration.sh amplitude-experiment --detailed
```

**What gets tested:**
- 📁 File structure validation
- 📦 Package.json compatibility  
- 🔗 Dependency resolution
- 🔨 Build process
- 🧪 Test execution
- 🔍 Linting compliance
- 🔧 Apps repository integration

**If validation fails:**
```bash
# Try auto-fixing common issues
./validate-migration.sh amplitude-experiment --fix-issues

# Then re-run validation
./validate-migration.sh amplitude-experiment
```

### Step 5: Manual Testing

Navigate to your migrated app and test it thoroughly:

```bash
cd ../apps/<app-name>

# Install dependencies
npm install

# Start the app
npm start
```

**Testing checklist:**
- [ ] App builds successfully (`npm run build`)
- [ ] App starts without errors (`npm start`)
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] App loads correctly in Contentful
- [ ] All app functionality works as expected
- [ ] App configuration is preserved
- [ ] App integrations work correctly

### Step 6: Test in Contentful

1. **Create or use an existing app definition** in Contentful
2. **Upload the built app** to test it works
3. **Test all app features** thoroughly
4. **Verify configuration screens** work correctly
5. **Test entry editor integrations** if applicable

### Step 7: Cleanup (Danger Zone!)

⚠️ **ONLY after thorough testing and confirmation that everything works!**

First, run a cleanup dry-run to see what would be deleted:

```bash
./cleanup-migrated-app.sh <app-name> --dry-run
```

If you're satisfied, run the actual cleanup:

```bash
./cleanup-migrated-app.sh <app-name>
```

**You'll be prompted to type "DELETE" to confirm** - this is intentional for safety!

## 🔧 Advanced Usage

### Migrating Multiple Apps

```bash
# List all apps you want to migrate
APPS_TO_MIGRATE=("amplitude-experiment" "bynder" "shopify")

# Migrate each app
for app in "${APPS_TO_MIGRATE[@]}"; do
    echo "Migrating $app..."
    ./migrate-app.sh "$app"
    ./validate-migration.sh "$app"
    echo "Manual testing required for $app before cleanup!"
done
```

### Fixing Common Issues

```bash
# If validation fails, try auto-fixing
./validate-migration.sh <app-name> --fix-issues

# If build fails, check dependencies
cd apps/<app-name>
npm audit fix
npm update

# If lerna integration fails
cd ..
npm run clean
npm run bootstrap
```

### Verbose Logging

For debugging issues, use verbose flags:

```bash
./migrate-app.sh <app-name> --verbose
./validate-migration.sh <app-name> --detailed
```

## 📊 Understanding Reports

Each script generates detailed reports:

### Migration Report
- Summary of what was migrated
- List of changes made
- Next steps checklist
- Links to log files

### Validation Report  
- Test results with pass/fail status
- Success rate percentage
- Issues found and recommendations
- Manual testing checklist

### Cleanup Report
- What was removed from marketplace-partner-apps
- Backup information
- Git commit details
- Recovery instructions

## 🚨 Troubleshooting

### Common Issues and Solutions

**"App not found in marketplace-partner-apps"**
```bash
# Check if the app exists
ls ../marketplace-partner-apps/apps/
# Make sure you're using the exact folder name
```

**"Prerequisites check failed"**
```bash
# Check Node.js version
node --version  # Should be 16+

# Check if jq is installed
brew install jq  # macOS
sudo apt-get install jq  # Ubuntu
```

**"Build fails after migration"**
```bash
cd apps/<app-name>
rm -rf node_modules package-lock.json
npm install
npm run build
```

**"Lerna bootstrap fails"**
```bash
# Clean everything and start fresh
npm run clean
rm -rf node_modules
npm ci
npm run bootstrap
```

**"Validation fails"**
```bash
# Try auto-fixing first
./validate-migration.sh <app-name> --fix-issues

# Check the validation report for specific issues
cat validation-report-<app-name>-*.md
```

### Getting Detailed Information

```bash
# View all available help
./migrate-app.sh --help
./validate-migration.sh --help
./cleanup-migrated-app.sh --help

# Check recent activity
./migration-summary.sh

# View log files
ls -la *.log
```

## 📁 File Structure After Migration

Your apps repository will look like this:

```
apps/
├── apps/
│   ├── existing-apps/...
│   └── your-migrated-app/          # 🆕 Your migrated app
│       ├── src/
│       ├── package.json            # Adapted for apps repo
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── ...
├── migrate-app.sh                  # Migration script
├── validate-migration.sh           # Validation script  
├── cleanup-migrated-app.sh         # Cleanup script
├── migration-summary.sh            # Quick reference
├── USAGE_GUIDE.md                  # This guide
├── MIGRATION_README.md             # Technical documentation
└── backups/                        # 🆕 Created after cleanup
    └── marketplace-partner-apps-*.tar.gz
```

## ✅ Success Criteria

Your migration is successful when:

- [ ] All validation tests pass
- [ ] App builds without errors
- [ ] App starts and runs correctly
- [ ] All functionality works in Contentful
- [ ] No regressions from original app
- [ ] Apps repository CI/CD pipeline accepts the app
- [ ] Lerna recognizes and can build the app

## 🔒 Safety Features

The scripts include multiple safety features:

- **Dry-run mode** - Preview changes before making them
- **Interactive confirmations** - Prevents accidental deletions
- **Automatic backups** - Created before any destructive operations
- **Comprehensive validation** - Ensures migration success before cleanup
- **Detailed logging** - Full audit trail of all operations
- **Rollback instructions** - How to undo changes if needed

## 🆘 Emergency Procedures

### If Something Goes Wrong During Migration

1. **Stop immediately** - Don't proceed with cleanup
2. **Check the logs** - Look at the generated log files
3. **Review the report** - Check the migration report for issues
4. **Delete the partially migrated app**:
   ```bash
   rm -rf ../apps/<app-name>
   ```
5. **Start over** with a dry-run to understand the issue

### If You Need to Rollback After Cleanup

1. **Find the backup**:
   ```bash
   ls backups/marketplace-partner-apps-<app-name>-*.tar.gz
   ```

2. **Restore from backup**:
   ```bash
   cd ../../marketplace-partner-apps/apps
   tar -xzf ../../apps/apps-migration-scripts/backups/marketplace-partner-apps-<app-name>-*.tar.gz
   cd ..
   git add apps/<app-name>
   git commit -m "Restore <app-name> from backup"
   ```

3. **Remove from apps repository**:
   ```bash
   cd ../../apps
   rm -rf apps/<app-name>
   ```

---

**🎉 You're ready to migrate! Start with a dry-run and take it step by step.**
