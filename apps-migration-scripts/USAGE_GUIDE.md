# 📖 Migration Scripts - Complete Command Reference

Comprehensive documentation for all migration commands, options, and advanced usage patterns.

> **New to migration?** Check out `GETTING_STARTED.md` for a step-by-step tutorial first.

## 📋 Quick Reference

| Script | Purpose | Basic Usage |
|--------|---------|-------------|
| `migrate-app.sh` | Transfer app from MPA to apps repo | `./migrate-app.sh <app-name>` |
| `validate-migration.sh` | Test migration success | `./validate-migration.sh <app-name>` |
| `cleanup-migrated-app.sh` | Remove from marketplace-partner-apps | `./cleanup-migrated-app.sh <app-name>` |
| `getting-started.sh` | Interactive tutorial | `./getting-started.sh` |
| `migration-summary.sh` | Quick reference and app list | `./migration-summary.sh` |

## 🔧 Detailed Command Documentation

### `migrate-app.sh` - Main Migration Script

**Purpose:** Transfer an app from marketplace-partner-apps to apps repository

**Basic Usage:**
```bash
./migrate-app.sh <app-name> [options]
```

**Options:**
- `--dry-run` - Preview changes without making them (always start here!)
- `--verbose` - Enable detailed logging
- `--help` - Show help message

**Examples:**
```bash
# Preview migration (safe)
./migrate-app.sh amplitude-experiment --dry-run

# Preview with detailed output
./migrate-app.sh amplitude-experiment --dry-run --verbose

# Actual migration
./migrate-app.sh amplitude-experiment

# Migration with detailed logging
./migrate-app.sh amplitude-experiment --verbose
```

**What it does:**
- ✅ Copies all app files (excluding build artifacts)
- ✅ Adapts package.json for apps repository conventions
- ✅ Adds missing configuration files
- ✅ Updates dependencies
- ✅ Integrates with Lerna build system
- ✅ Generates migration report

**Output files:**
- `logs/<app-name>-migration-YYYYMMDD-HHMMSS.log` - Detailed log
- `reports/<app-name>-migration-report-YYYYMMDD-HHMMSS.md` - Summary report

---

### `validate-migration.sh` - Validation Script

**Purpose:** Comprehensive testing of migrated app

**Basic Usage:**
```bash
./validate-migration.sh <app-name> [options]
```

**Options:**
- `--detailed` - Show verbose debug information
- `--fix-issues` - Automatically fix common issues
- `--help` - Show help message

**Examples:**
```bash
# Basic validation
./validate-migration.sh amplitude-experiment

# Detailed validation with debug info
./validate-migration.sh amplitude-experiment --detailed

# Try to auto-fix issues
./validate-migration.sh amplitude-experiment --fix-issues
```

**Validation checks:**
- 📁 File structure validation
- 📦 Package.json compatibility
- 🔗 Dependency resolution
- 🔨 Build process
- 🧪 Test execution
- 🔍 Linting compliance
- 🔧 Apps repository integration

**Output files:**
- `logs/<app-name>-validation-YYYYMMDD-HHMMSS.log` - Detailed log
- `reports/<app-name>-validation-report-YYYYMMDD-HHMMSS.md` - Test results

---

### `cleanup-migrated-app.sh` - Cleanup Script

**Purpose:** Remove successfully migrated app from marketplace-partner-apps

⚠️ **DESTRUCTIVE OPERATION** - Only use after thorough testing!

**Basic Usage:**
```bash
./cleanup-migrated-app.sh <app-name> [options]
```

**Options:**
- `--dry-run` - Preview what would be deleted
- `--force` - Skip interactive confirmations
- `--help` - Show help message

**Examples:**
```bash
# Preview cleanup (safe)
./cleanup-migrated-app.sh amplitude-experiment --dry-run

# Interactive cleanup (recommended)
./cleanup-migrated-app.sh amplitude-experiment

# Skip confirmations (dangerous!)
./cleanup-migrated-app.sh amplitude-experiment --force
```

**Safety features:**
- 🔒 Requires typing "DELETE" to confirm
- 💾 Creates backup before deletion
- ✅ Verifies app works in apps repository
- 📝 Updates release configuration files

**Output files:**
- `logs/<app-name>-cleanup-YYYYMMDD-HHMMSS.log` - Detailed log
- `reports/<app-name>-cleanup-report-YYYYMMDD-HHMMSS.md` - Summary report
- `backups/marketplace-partner-apps-<app>-YYYYMMDD-HHMMSS.tar.gz` - Backup

---

### `migration-summary.sh` - Quick Reference

**Purpose:** Show available apps and quick command reference

**Usage:**
```bash
./migration-summary.sh
```

**What it shows:**
- List of all available apps in marketplace-partner-apps
- Quick command reference
- Documentation links
- Recent migration activity

---

### `getting-started.sh` - Interactive Tutorial

**Purpose:** Interactive guide for first-time users

**Usage:**
```bash
./getting-started.sh
```

**Features:**
- Checks prerequisites automatically
- Shows available apps
- Guides through first migration
- Provides safety warnings

## 🔧 Advanced Usage Patterns

### Migrating Multiple Apps

```bash
# List all apps you want to migrate
APPS_TO_MIGRATE=("amplitude-experiment" "bynder" "shopify")

# Migrate each app (recommended: one at a time)
for app in "${APPS_TO_MIGRATE[@]}"; do
    echo "=== Migrating $app ==="
    ./migrate-app.sh "$app" --verbose
    ./validate-migration.sh "$app"
    echo "=== $app migration complete - test before cleanup! ==="
done
```

### Batch Validation

```bash
# Validate multiple migrated apps
for app in ../apps/*/; do
    app_name=$(basename "$app")
    echo "Validating $app_name..."
    ./validate-migration.sh "$app_name" --detailed
done
```

### Custom Workflows

**Migration with custom validation:**
```bash
# Migrate with extra validation steps
./migrate-app.sh my-app --verbose
./validate-migration.sh my-app --detailed

# Custom tests
cd ../apps/my-app
npm run custom-test
npm run security-scan

# Cleanup if all good
cd ../apps-migration-scripts
./cleanup-migrated-app.sh my-app
```

**Conditional cleanup:**
```bash
# Only cleanup if validation passes
if ./validate-migration.sh my-app; then
    echo "Validation passed - safe to cleanup"
    ./cleanup-migrated-app.sh my-app
else
    echo "Validation failed - manual review needed"
fi
```

## 🚨 Troubleshooting Guide

### Common Issues and Solutions

**Migration Fails - "App not found"**
```bash
# Check app name spelling
ls ../../marketplace-partner-apps/apps/

# Verify repository structure
pwd  # Should be in apps-migration-scripts
ls ../../marketplace-partner-apps  # Should show apps/ directory
```

**Build Fails After Migration**
```bash
# Check the specific error
cd ../apps/<app-name>
npm run build 2>&1 | tee build-error.log

# Common fixes:
rm -rf node_modules package-lock.json
npm install
npm audit fix
npm run build
```

**Validation Fails**
```bash
# Get detailed error information
./validate-migration.sh <app-name> --detailed

# Try auto-fixing
./validate-migration.sh <app-name> --fix-issues

# Check specific issues
cat logs/validation-*.log | grep ERROR
```

**Lerna Integration Issues**
```bash
# From apps repository root
cd ..
npm run clean
npm run bootstrap

# Check if app is recognized
npx lerna list | grep <app-name>
```

**Permission Errors**
```bash
# Fix script permissions
chmod +x *.sh

# Fix app file permissions
find ../apps/<app-name> -name "*.sh" -exec chmod +x {} \;
```

### Log Analysis

**Find specific errors:**
```bash
# All errors from latest migration
grep "\[ERROR\]" logs/<app-name>-migration-*.log | tail -20

# Build-related issues
grep -i "build\|compile\|error" logs/<app-name>-validation-*.log

# Dependency issues
grep -i "npm\|dependency\|package" logs/<app-name>-migration-*.log
```

**Check timing and performance:**
```bash
# Migration timing
grep "completed\|started" logs/<app-name>-migration-*.log

# Validation results summary
grep "SUCCESS\|FAIL" logs/<app-name>-validation-*.log
```

### Recovery Procedures

**Partial Migration Cleanup**
```bash
# Remove incomplete migration
rm -rf ../apps/<app-name>

# Clean temporary files
rm -f reports/<app-name>-*-report-*.md

# Start over
./migrate-app.sh <app-name> --dry-run
```

**Rollback After Cleanup**
```bash
# Find backup
ls backups/marketplace-partner-apps-<app-name>-*.tar.gz

# Restore marketplace-partner-apps
cd ../../marketplace-partner-apps/apps
tar -xzf ../../apps/apps-migration-scripts/backups/marketplace-partner-apps-<app-name>-*.tar.gz
cd .. && git add . && git commit -m "Restore <app-name>"

# Remove from apps repository  
cd ../apps && rm -rf apps/<app-name>
```

## 📊 Generated Files Reference

### Log Files (`logs/`)

| File Pattern | Content | When Created |
|--------------|---------|--------------|
| `<app-name>-migration-YYYYMMDD-HHMMSS.log` | Detailed migration log | Every migration |
| `<app-name>-validation-YYYYMMDD-HHMMSS.log` | Validation test results | Every validation |
| `<app-name>-cleanup-YYYYMMDD-HHMMSS.log` | Cleanup operation log | Every cleanup |

### Report Files (`reports/`)

| File Pattern | Content | Purpose |
|--------------|---------|---------|
| `<app-name>-migration-report-YYYYMMDD-HHMMSS.md` | Migration summary | Next steps guidance |
| `<app-name>-validation-report-YYYYMMDD-HHMMSS.md` | Test results | Issue identification |
| `<app-name>-cleanup-report-YYYYMMDD-HHMMSS.md` | Cleanup summary | Confirmation & recovery info |

### Backup Files (`backups/`)

| File Pattern | Content | When Created |
|--------------|---------|--------------|
| `marketplace-partner-apps-<app>-YYYYMMDD-HHMMSS.tar.gz` | Complete app backup | Before cleanup |

## 🎯 Best Practices

### For Successful Migrations

1. **Always start with dry-run** - Preview changes before making them
2. **Test thoroughly** - Don't rush to cleanup 
3. **One app at a time** - Avoid parallel migrations initially
4. **Read the reports** - They contain valuable troubleshooting info
5. **Keep logs** - Essential for debugging issues

### For Troubleshooting

1. **Check prerequisites first** - Most issues stem from setup problems
2. **Use verbose logging** - Get detailed information about failures
3. **Read error messages carefully** - They usually indicate the exact problem
4. **Test in isolation** - Isolate issues by testing individual components
5. **Document custom fixes** - Help improve the scripts for others

### For Production Use

1. **Practice on simple apps first** - Build confidence with the process
2. **Have rollback plan** - Know how to recover if something goes wrong
3. **Coordinate with team** - Ensure others are aware of migration activities
4. **Update documentation** - Note any app-specific requirements or issues
5. **Test in staging first** - Never migrate directly to production apps

---

For technical details about script internals, see `TECHNICAL_REFERENCE.md`.
