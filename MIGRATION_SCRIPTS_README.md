# 🚀 Marketplace Partner Apps Migration Scripts

Welcome! These scripts help you migrate apps from the `marketplace-partner-apps` repository to the `apps` repository.

## 🎯 Quick Start for New Users

**Choose your path:**

### 🆕 First Time? Start Here!
```bash
./getting-started.sh
```
Interactive guide that walks you through everything step-by-step.

### 📖 Want to Read First?
```bash
cat USAGE_GUIDE.md
```
Comprehensive step-by-step instructions with examples and troubleshooting.

### ⚡ Already Know What You're Doing?
```bash
./migration-summary.sh
```
Quick reference with all commands and available apps.

## 📋 The 4-Step Process

1. **🔍 Preview (Dry-run)**: `./migrate-app.sh <app-name> --dry-run`
2. **📦 Migrate**: `./migrate-app.sh <app-name>`
3. **✅ Validate**: `./validate-migration.sh <app-name>`
4. **🗑️ Cleanup**: `./cleanup-migrated-app.sh <app-name>` *(after thorough testing!)*

## 📚 Documentation

| File | Purpose | When to Use |
|------|---------|-------------|
| `USAGE_GUIDE.md` | Step-by-step instructions | **Start here for detailed guidance** |
| `MIGRATION_README.md` | Technical documentation | Reference for advanced usage |
| `getting-started.sh` | Interactive tutorial | Perfect for first-time users |
| `migration-summary.sh` | Quick reference | When you need a quick reminder |

## 🛠️ Available Scripts

| Script | Purpose | Example |
|--------|---------|---------|
| `migrate-app.sh` | Transfer app to apps repo | `./migrate-app.sh amplitude-experiment` |
| `validate-migration.sh` | Test migration success | `./validate-migration.sh amplitude-experiment` |
| `cleanup-migrated-app.sh` | Remove from marketplace-partner-apps | `./cleanup-migrated-app.sh amplitude-experiment` |

## ⚠️ Important Safety Notes

- **Always start with `--dry-run`** to preview changes
- **Test thoroughly** before running cleanup
- **Cleanup is destructive** - it permanently deletes files
- **Backups are created** automatically during cleanup

## 🆘 Need Help?

- **Interactive guidance**: `./getting-started.sh`
- **Quick reference**: `./migration-summary.sh`
- **Script help**: `./migrate-app.sh --help`
- **Detailed guide**: `cat USAGE_GUIDE.md`

---

**🎉 Ready to migrate? Run `./getting-started.sh` to begin!**
