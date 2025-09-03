# 🚀 App Migration Scripts

This directory contains all the scripts and documentation needed to migrate apps from the `marketplace-partner-apps` repository to the `apps` repository.

## 📁 Directory Structure

```
apps-migration-scripts/
├── migrate-app.sh              # Main migration script
├── validate-migration.sh       # Validation script
├── cleanup-migrated-app.sh     # Cleanup script
├── getting-started.sh          # Interactive tutorial
├── migration-summary.sh        # Quick reference
├── README.md                   # This file
├── USAGE_GUIDE.md             # Detailed step-by-step guide
├── MIGRATION_README.md         # Technical documentation
├── MIGRATION_SCRIPTS_README.md # Overview and entry points
├── logs/                      # All script logs go here
└── backups/                   # Created during cleanup
```

## 🚀 Quick Start

**First time users:**
```bash
cd apps-migration-scripts
./getting-started.sh
```

**Quick reference:**
```bash
cd apps-migration-scripts
./migration-summary.sh
```

**Standard workflow:**
```bash
cd apps-migration-scripts

# 1. Preview migration (safe)
./migrate-app.sh <app-name> --dry-run

# 2. Migrate the app
./migrate-app.sh <app-name>

# 3. Validate migration
./validate-migration.sh <app-name>

# 4. Test manually in Contentful

# 5. Cleanup (after thorough testing!)
./cleanup-migrated-app.sh <app-name>
```

## 📋 Prerequisites

- Both repositories cloned side-by-side:
  ```
  your-projects-folder/
  ├── apps/                          # This repository
  │   └── apps-migration-scripts/    # These scripts
  └── marketplace-partner-apps/      # Partner apps repository
  ```
- Node.js 16+, npm, git, jq installed
- Run scripts from the `apps-migration-scripts` directory

## 📖 Documentation

- **USAGE_GUIDE.md** - Complete step-by-step instructions
- **MIGRATION_README.md** - Technical reference
- **MIGRATION_SCRIPTS_README.md** - Quick overview

## 📁 File Locations

All generated files are organized as follows:

- **Logs**: `logs/migration-*.log`, `logs/validation-*.log`, `logs/cleanup-*.log`
- **Reports**: Generated in this directory as `*-report-*.md`
- **Backups**: `backups/marketplace-partner-apps-*.tar.gz`

## ⚠️ Important Notes

1. **Always run from this directory** - The scripts are configured for their current location
2. **Logs are automatically saved** in the `logs/` subdirectory
3. **Backups are created** during cleanup in the `backups/` subdirectory
4. **Start with dry-run** to preview changes safely

## 🔧 Path Configuration

The scripts automatically detect their location and set paths relative to:
- Apps repository root: `../` (parent directory)
- Marketplace-partner-apps: `../../marketplace-partner-apps`
- Logs directory: `logs/`
- Backups directory: `backups/`

## 🆘 Getting Help

```bash
# General help
./migrate-app.sh --help
./validate-migration.sh --help
./cleanup-migrated-app.sh --help

# Interactive tutorial
./getting-started.sh

# Quick reference
./migration-summary.sh

# Read the guides
cat USAGE_GUIDE.md
```

---

**🎉 Ready to migrate? Start with `./getting-started.sh` for an interactive walkthrough!**
