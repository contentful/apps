# 🚀 App Migration Scripts

Migrate apps from `marketplace-partner-apps` to the `apps` repository with automated scripts, intelligent validation, and comprehensive safety features.

## 🎯 Choose Your Starting Point

### 🆕 **New to Migration?**
```bash
./getting-started.sh
```
Interactive tutorial with app selection, safety checks, and guided first migration.

### 📚 **Want the Complete Guide?**
```bash
cat GETTING_STARTED.md
```
Comprehensive tutorial with examples, troubleshooting, and best practices.

### ⚡ **Quick Reference Needed?**
```bash
./migration-summary.sh
```
See all available apps and get command reminders (auto-exits when done).

### 🔧 **Advanced User?**
```bash
cat USAGE_GUIDE.md
```
Complete command reference, options, and technical details.

## 📋 The Migration Process

```bash
# 1. Preview (always start here!)
./migrate-app.sh <app-name> --dry-run

# 2. Migrate with automatic fixes
./migrate-app.sh <app-name>

# 3. Validate with smart handling
./validate-migration.sh <app-name>

# 4. Test manually in Contentful (essential!)

# 5. Cleanup when fully verified (destructive!)
./cleanup-migrated-app.sh <app-name>
```

✨ **New Features:**
- **Smart validation** - Handles missing files gracefully, adds items to manual checklist instead of failing
- **Timeout protection** - Tests won't hang in watch mode (60s limit)
- **Enhanced error reporting** - Clear, actionable error messages with context
- **TypeScript fixes** - Automatic `vitest/globals` → `node` fixes and `vi` import handling

## 📁 What's In This Directory

| File | Purpose |
|------|---------|
| **Scripts** | |
| `migrate-app.sh` | Main migration script |
| `validate-migration.sh` | Test migration success |
| `cleanup-migrated-app.sh` | Remove from marketplace-partner-apps |
| `getting-started.sh` | Interactive tutorial |
| `migration-summary.sh` | Quick reference tool |
| **Documentation** | |
| `README.md` | This overview (start here) |
| `GETTING_STARTED.md` | Step-by-step tutorial |
| `USAGE_GUIDE.md` | Complete command reference |
| `TECHNICAL_REFERENCE.md` | Advanced technical details |
| **Generated** | |
| `logs/` | All script logs (auto-created, app name prefixed) |
| `reports/` | Migration reports (auto-created, organized by app) |
| `backups/` | Cleanup backups (auto-created for safety) |

## ⚠️ Prerequisites

Ensure you have this structure:
```
your-projects-folder/
├── apps/                          # This repository
│   └── apps-migration-scripts/    # You are here
└── marketplace-partner-apps/      # Source repository
```

**Required tools:** Node.js 16+, npm, git, jq

**✅ Auto-setup:** The scripts automatically create `logs/`, `reports/`, and `backups/` directories as needed.

## 🆘 Need Help?

- **Can't decide where to start?** → Run `./getting-started.sh`
- **Script not working?** → Check `GETTING_STARTED.md` troubleshooting section
- **Advanced customization?** → See `TECHNICAL_REFERENCE.md`
- **Command options?** → Use `<script-name> --help` or check `USAGE_GUIDE.md`

---
**🎉 Ready? Most users should start with `./getting-started.sh`**
