# 🚀 Getting Started with App Migration

Your first migration from marketplace-partner-apps to apps repository, step by step.

## 📋 Before You Begin

**Quick checklist** (5 minutes):

- [ ] **Repository structure** - Verify you have:
  ```
  your-projects-folder/
  ├── apps/                          # Target repository
  │   └── apps-migration-scripts/    # You are here
  └── marketplace-partner-apps/      # Source repository
  ```

- [ ] **Tools installed** - Quick check:
  ```bash
  node --version    # Should be 16+
  npm --version     # Should be 8+
  git --version     # Any recent version
  jq --version      # Any version
  ```

- [ ] **Repositories updated**:
  ```bash
  # Update both repos to latest
  cd ../../marketplace-partner-apps && git pull
  cd ../apps && git pull
  cd apps-migration-scripts
  ```

## 🎯 Your First Migration

### Step 1: Choose an App

See what's available:
```bash
./migration-summary.sh
```

Pick an app that's **simple to start with** (avoid complex multi-service apps for your first try).

### Step 2: Preview the Migration (Safe!)

**Always start with a dry-run** - this shows you what will happen without making changes:

```bash
./migrate-app.sh <app-name> --dry-run
```

**Example:**
```bash
./migrate-app.sh amplitude-experiment --dry-run
```

**What to look for:**
- ✅ No error messages
- ✅ Files listed look reasonable
- ✅ Package.json changes make sense

### Step 3: Run the Migration

If the dry-run looked good:

```bash
./migrate-app.sh <app-name>
```

**This will:**
- Copy all app files
- Adapt package.json for apps repository
- Update dependencies
- Add missing config files
- Run lerna bootstrap

### Step 4: Validate Everything Works

```bash
./validate-migration.sh <app-name>
```

**This tests:**
- File structure is correct
- Package.json is valid
- Dependencies resolve
- App builds successfully
- Tests pass (if any)
- Lerna integration works

**If validation fails:**
```bash
# Try auto-fixing common issues
./validate-migration.sh <app-name> --fix-issues
```

### Step 5: Manual Testing

Test the migrated app:

```bash
# Navigate to the migrated app
cd ../apps/<app-name>

# Install dependencies (if not done automatically)
npm install

# Try to build
npm run build

# Try to start
npm start
```

**Test checklist:**
- [ ] App builds without errors
- [ ] App starts successfully
- [ ] Basic functionality works
- [ ] No obvious regressions

### Step 6: Test in Contentful

1. Upload the built app to a test Contentful space
2. Test all major features
3. Verify configurations work
4. Check integrations function correctly

### Step 7: Cleanup (Danger Zone!)

**⚠️ Only after you're 100% confident everything works!**

```bash
# Return to migration scripts directory
cd ../apps-migration-scripts

# Preview what will be deleted
./cleanup-migrated-app.sh <app-name> --dry-run

# If you're sure, run the cleanup
./cleanup-migrated-app.sh <app-name>
```

**This will:**
- Create a backup (just in case)
- Remove app from marketplace-partner-apps
- Update configuration files
- Commit the changes

## 🚨 What If Something Goes Wrong?

### Migration Failed

```bash
# Check the logs
cat logs/migration-*.log

# Remove partial migration
rm -rf ../apps/<app-name>

# Try again with verbose logging
./migrate-app.sh <app-name> --verbose
```

### Validation Failed

```bash
# Check the validation report
cat validation-report-*.md

# Try auto-fixing
./validate-migration.sh <app-name> --fix-issues

# Check specific issues in logs
cat logs/validation-*.log
```

### Build Failed

```bash
cd ../apps/<app-name>

# Clear everything and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run build

# Check for missing dependencies
npm audit
```

### Need to Rollback After Cleanup

```bash
# Find the backup
ls backups/marketplace-partner-apps-<app-name>-*.tar.gz

# Restore it
cd ../../marketplace-partner-apps/apps
tar -xzf ../../apps/apps-migration-scripts/backups/marketplace-partner-apps-<app-name>-*.tar.gz
cd .. && git add . && git commit -m "Restore <app-name>"

# Remove from apps repo
cd ../apps && rm -rf apps/<app-name>
```

## 💡 Pro Tips

### For Your First Migration

1. **Pick a simple app** - avoid complex multi-service apps
2. **Use dry-run extensively** - it's completely safe
3. **Test thoroughly** - don't rush to cleanup
4. **Read the reports** - they contain valuable info

### Making It Smooth

1. **Check prerequisites first** - saves debugging time
2. **Update repos before starting** - avoids conflicts
3. **One app at a time** - don't try to migrate multiple apps simultaneously
4. **Keep backups** - cleanup creates them automatically

### Getting Comfortable

1. **Run validation twice** - it's fast and catches issues early
2. **Test in a sandbox space** - don't use production for first attempts
3. **Keep notes** - document any custom fixes needed
4. **Ask for help** - use `<script> --help` for quick guidance

## 🎯 What's Next?

After your first successful migration:

1. **Try more complex apps** - multi-service, custom configs, etc.
2. **Batch migrations** - migrate several related apps
3. **Customize the process** - see `TECHNICAL_REFERENCE.md` for advanced options
4. **Share learnings** - help improve the scripts for others

## 📚 More Resources

- **Command reference**: `USAGE_GUIDE.md` - all commands and options
- **Technical details**: `TECHNICAL_REFERENCE.md` - how things work internally
- **Quick help**: `./migration-summary.sh` - commands and available apps
- **Interactive guide**: `./getting-started.sh` - terminal-based tutorial

---

**🎉 You're ready! Start with a simple app and take it step by step.**
