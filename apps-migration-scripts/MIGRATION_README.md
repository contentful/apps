# Marketplace Partner Apps Migration Scripts

This directory contains comprehensive scripts for migrating apps from the `marketplace-partner-apps` repository to the `apps` repository, ensuring seamless integration with the apps repository's build system and CI/CD pipeline.

## 📋 Overview

These scripts automate the process of:
1. **Transferring** an app from marketplace-partner-apps to apps repository
2. **Validating** the migration was successful
3. **Cleaning up** the original app from marketplace-partner-apps (after verification)

## 🚀 Quick Start

> **👀 First time? Read the [step-by-step USAGE_GUIDE.md](USAGE_GUIDE.md) for detailed instructions!**

### Prerequisites

- Both repositories cloned side-by-side:
  ```
  projects/
  ├── apps/
  └── marketplace-partner-apps/
  ```
- Node.js 16+ and npm
- Git and jq installed

### Basic Migration Workflow

1. **Start with a dry-run:**
   ```bash
   ./migrate-app.sh <app-name> --dry-run
   ```

2. **Migrate the app:**
   ```bash
   ./migrate-app.sh <app-name>
   ```

3. **Validate the migration:**
   ```bash
   ./validate-migration.sh <app-name>
   ```

4. **Test manually** in Contentful

5. **Clean up original** (after thorough testing):
   ```bash
   ./cleanup-migrated-app.sh <app-name>
   ```

> **📖 For detailed step-by-step instructions, troubleshooting, and examples, see [USAGE_GUIDE.md](USAGE_GUIDE.md)**

## 📝 Detailed Usage

### 1. Migration Script (`migrate-app.sh`)

Transfers an app from marketplace-partner-apps to the apps repository.

```bash
./migrate-app.sh <app-name> [options]

Options:
  --dry-run     Show what would be done without making changes
  --verbose     Enable detailed logging
  --help        Show usage information

Examples:
  ./migrate-app.sh amplitude-experiment
  ./migrate-app.sh bynder --dry-run
  ./migrate-app.sh shopify --verbose
```

**What it does:**
- ✅ Copies all app files (excluding build artifacts)
- ✅ Adapts `package.json` for apps repository conventions
- ✅ Adds missing configuration files (tsconfig.json, vite.config.ts, etc.)
- ✅ Updates dependencies and package-lock.json
- ✅ Integrates with Lerna build system
- ✅ Creates detailed migration report

### 2. Validation Script (`validate-migration.sh`)

Validates that the migration was successful and the app works correctly.

```bash
./validate-migration.sh <app-name> [options]

Options:
  --detailed      Show verbose debug information
  --fix-issues    Automatically fix common issues
  --help          Show usage information

Examples:
  ./validate-migration.sh amplitude-experiment
  ./validate-migration.sh bynder --detailed
  ./validate-migration.sh shopify --fix-issues
```

**Validation Checks:**
- 📁 File structure validation
- 📦 Package.json compatibility
- 🔗 Dependency resolution
- 🔨 Build process
- 🧪 Test execution
- 🔍 Linting compliance
- 🔧 Apps repository integration

### 3. Cleanup Script (`cleanup-migrated-app.sh`)

⚠️ **DANGER: Permanently deletes files from marketplace-partner-apps!**

Only run after thorough testing and validation.

```bash
./cleanup-migrated-app.sh <app-name> [options]

Options:
  --force       Skip interactive confirmations
  --dry-run     Show what would be deleted
  --help        Show usage information

Examples:
  ./cleanup-migrated-app.sh amplitude-experiment
  ./cleanup-migrated-app.sh bynder --dry-run
  ./cleanup-migrated-app.sh shopify --force
```

**Safety Features:**
- 🔒 Requires explicit confirmation (type "DELETE")
- 💾 Creates backup before deletion
- ✅ Verifies app works in apps repository
- 📝 Updates release configuration files
- 📋 Commits changes with proper message

## 🏗 What Gets Migrated

### Files Transferred
- All source code (`src/`, `public/`, etc.)
- Configuration files (package.json, tsconfig.json, etc.)
- Documentation (README.md, LICENSE, etc.)
- Test files (`test/`, `tests/`, `src/__tests__/`)

### Files NOT Transferred
- `node_modules/` (regenerated)
- Build artifacts (`build/`, `dist/`)
- Git history (new commits in apps repo)
- Log files

### Package.json Adaptations
- Adds `@contentful/` scope if missing
- Updates scripts for apps repository conventions:
  - Adds `test:ci`, `lint`, `verify-config` scripts
  - Removes marketplace-partner-apps specific scripts
- Ensures compatibility with Lerna build system
- Updates dependency versions if needed

## 🔧 Configuration Changes

### Apps Repository Integration
- Integrates with Lerna monorepo structure
- Uses apps repository CI/CD pipeline
- Follows apps repository naming conventions
- Adapts build and deploy scripts

### Added Configuration Files
- `tsconfig.json` (if missing and using TypeScript)
- `vite.config.ts` (if missing and using Vite)
- `vitest.config.ts` (if tests exist but no config)

## 📊 Migration Reports

Each script generates detailed reports:

- **Migration Report** (`migration-report-<app>-<timestamp>.md`)
- **Validation Report** (`validation-report-<app>-<timestamp>.md`)
- **Cleanup Report** (`cleanup-report-<app>-<timestamp>.md`)

Reports include:
- Summary of actions performed
- Test results and validation status
- Next steps and recommendations
- Links to log files

## 🚨 Troubleshooting

### Common Issues

**Build Fails After Migration:**
```bash
# Try fixing automatically
./validate-migration.sh <app-name> --fix-issues

# Or fix manually:
cd apps/<app-name>
npm install
npm run build
```

**Lerna Bootstrap Fails:**
```bash
# Clean and retry
npm run clean
npm run bootstrap
```

**Dependencies Out of Date:**
```bash
cd apps/<app-name>
npm update
npm audit fix
```

### Getting Help

1. Run scripts with `--help` flag for usage information
2. Use `--dry-run` to preview changes
3. Use `--verbose` or `--detailed` for debug information
4. Check generated log files and reports

## 📁 File Structure After Migration

```
apps/
├── apps/
│   └── <your-app>/           # Migrated app
│       ├── src/
│       ├── package.json      # Adapted for apps repo
│       ├── tsconfig.json
│       ├── vite.config.ts
│       └── ...
├── migrate-app.sh            # Migration script
├── validate-migration.sh     # Validation script
├── cleanup-migrated-app.sh   # Cleanup script
├── MIGRATION_README.md       # This file
├── migration-*.log           # Migration logs
├── validation-*.log          # Validation logs
├── cleanup-*.log            # Cleanup logs
├── *-report-*.md            # Generated reports
└── backups/                 # Backups from cleanup
    └── marketplace-partner-apps-<app>-*.tar.gz
```

## ⚠️ Important Notes

### Before Migration
- Ensure both repositories are up to date
- Create a backup of marketplace-partner-apps
- Test the app works in marketplace-partner-apps

### During Migration
- Run with `--dry-run` first to preview changes
- Review generated migration reports
- Test thoroughly before cleanup

### After Migration
- Validate the app works correctly
- Test all functionality in Contentful
- Update any external references
- Only run cleanup after thorough testing

### Security Considerations
- Scripts create backups before destructive operations
- All changes are logged and can be reviewed
- Interactive confirmations prevent accidental deletions
- Git commits track all changes

## 🔄 Rollback Procedure

If you need to rollback a migration:

1. **Before cleanup:** Simply delete the app from apps repository
2. **After cleanup:** Restore from backup:
   ```bash
   cd ../marketplace-partner-apps/apps
   tar -xzf ../../apps/backups/marketplace-partner-apps-<app>-*.tar.gz
   cd ../
   git add apps/<app-name>
   git commit -m "Restore <app-name> from backup"
   ```

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review generated log files and reports
3. Test with `--dry-run` and `--verbose` flags
4. Ensure prerequisites are met

---

**⚠️ Always test thoroughly before running cleanup script!**
