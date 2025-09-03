# 🚀 App Migration Scripts

Migrate apps from `marketplace-partner-apps` to the `apps` repository with automated scripts and comprehensive validation.

## 🎯 Choose Your Starting Point

### 🆕 **New to Migration?**
```bash
./getting-started.sh
```
Interactive tutorial that walks you through your first migration step-by-step.

### 📚 **Want the Complete Guide?**
```bash
cat GETTING_STARTED.md
```
Comprehensive tutorial with examples, troubleshooting, and best practices.

### ⚡ **Quick Reference Needed?**
```bash
./migration-summary.sh
```
See all available apps and get command reminders.

### 🔧 **Advanced User?**
```bash
cat USAGE_GUIDE.md
```
Complete command reference, options, and technical details.

## 📋 The Migration Process

```bash
# 1. Preview (always start here!)
./migrate-app.sh <app-name> --dry-run

# 2. Migrate 
./migrate-app.sh <app-name>

# 3. Validate
./validate-migration.sh <app-name>

# 4. Test manually in Contentful

# 5. Cleanup (destructive - be sure!)
./cleanup-migrated-app.sh <app-name>
```

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
| `logs/` | All script logs (with app name prefix) |
| `reports/` | Migration reports (organized by app) |
| `backups/` | Cleanup backups |

## ⚠️ Prerequisites

Ensure you have this structure:
```
your-projects-folder/
├── apps/                          # This repository
│   └── apps-migration-scripts/    # You are here
└── marketplace-partner-apps/      # Source repository
```

**Required tools:** Node.js 16+, npm, git, jq

## 🆘 Need Help?

- **Can't decide where to start?** → Run `./getting-started.sh`
- **Script not working?** → Check `GETTING_STARTED.md` troubleshooting section
- **Advanced customization?** → See `TECHNICAL_REFERENCE.md`
- **Command options?** → Use `<script-name> --help` or check `USAGE_GUIDE.md`

---
**🎉 Ready? Most users should start with `./getting-started.sh`**
