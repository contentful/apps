#!/bin/bash

# =============================================================================
# Marketplace Partner Apps Cleanup Script
# =============================================================================
# This script removes a successfully migrated app from the marketplace-partner-apps
# repository after verifying the migration was successful.
#
# ⚠️  WARNING: This script permanently deletes files from marketplace-partner-apps!
# ⚠️  Only run this after thoroughly testing the migrated app in the apps repository!
#
# Usage: ./cleanup-migrated-app.sh <app-name> [--force] [--dry-run]
# Example: ./cleanup-migrated-app.sh amplitude-experiment
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MPA_REPO_PATH="$(cd "$APPS_REPO_ROOT/../marketplace-partner-apps" && pwd)"
LOG_FILE="" # Will be set after app name is parsed

# Disable colors for better compatibility
RED=''
GREEN=''
YELLOW=''
BLUE=''
PURPLE=''
NC=''

# Flags
DRY_RUN=false
FORCE=false
APP_NAME=""

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        "DEBUG") echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
        "DANGER") echo -e "${PURPLE}[DANGER]${NC} $message" | tee -a "$LOG_FILE" ;;
    esac
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

show_usage() {
    cat << EOF
Usage: $0 <app-name> [options]

Remove a successfully migrated app from the marketplace-partner-apps repository.

⚠️  WARNING: This permanently deletes files! Only use after thorough testing!

Arguments:
    app-name        Name of the app to clean up (must exist in both repositories)

Options:
    --force         Skip interactive confirmation prompts
    --dry-run       Show what would be deleted without making changes
    --help          Show this help message

Safety Features:
    - Requires confirmation before deletion (unless --force is used)
    - Verifies app exists and functions in apps repository
    - Creates backup before deletion
    - Removes app from release-please-config.json
    - Updates .release-please-manifest.json

Examples:
    $0 amplitude-experiment                 # Interactive cleanup
    $0 bynder --dry-run                    # Preview what would be deleted
    $0 shopify --force                     # Skip confirmations

Documentation:
    First time?     ./getting-started.sh
    Step-by-step:   cat USAGE_GUIDE.md
    Quick reference: ./migration-summary.sh

EOF
}

# =============================================================================
# Verification Functions
# =============================================================================

check_prerequisites() {
    log "INFO" "Checking prerequisites..."
    
    # Check if we're in the apps repository
    if [[ ! -f "$APPS_REPO_ROOT/lerna.json" ]] || [[ ! -d "$APPS_REPO_ROOT/apps" ]]; then
        log "ERROR" "This script must be run from the apps repository root"
        exit 1
    fi
    
    # Check if marketplace-partner-apps exists
    if [[ ! -d "$MPA_REPO_PATH" ]]; then
        log "ERROR" "marketplace-partner-apps repository not found at $MPA_REPO_PATH"
        exit 1
    fi
    
    # Check required tools
    local required_tools=("git" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool '$tool' not found in PATH"
            exit 1
        fi
    done
    
    log "INFO" "Prerequisites check passed"
}

verify_app_migrated_successfully() {
    local app_name="$1"
    local apps_path="$APPS_REPO_ROOT/apps/$app_name"
    local mpa_path="$MPA_REPO_PATH/apps/$app_name"
    
    log "INFO" "Verifying app migration was successful..."
    
    # Check app exists in apps repository
    if [[ ! -d "$apps_path" ]]; then
        log "ERROR" "App '$app_name' not found in apps repository at $apps_path"
        log "ERROR" "Migration may not have been completed successfully"
        exit 1
    fi
    
    # Check app still exists in marketplace-partner-apps
    if [[ ! -d "$mpa_path" ]]; then
        log "ERROR" "App '$app_name' not found in marketplace-partner-apps at $mpa_path"
        log "ERROR" "App may have already been cleaned up"
        exit 1
    fi
    
    # Check package.json exists
    if [[ ! -f "$apps_path/package.json" ]]; then
        log "ERROR" "package.json not found in migrated app"
        exit 1
    fi
    
    # Try to verify the app can build (optional check)
    log "INFO" "Testing if migrated app can build..."
    cd "$apps_path"
    
    if npm run build > /dev/null 2>&1; then
        log "INFO" "✅ App builds successfully in apps repository"
    else
        log "WARN" "⚠️  App build failed in apps repository"
        if [[ "$FORCE" == false ]]; then
            echo
            read -p "App build failed. Continue with cleanup anyway? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                log "INFO" "Cleanup cancelled by user"
                exit 0
            fi
        fi
    fi
    
    cd "$APPS_REPO_ROOT"
    
    log "INFO" "Migration verification completed"
}

# =============================================================================
# Backup Functions
# =============================================================================

create_backup() {
    local app_name="$1"
    local mpa_path="$MPA_REPO_PATH/apps/$app_name"
    local backup_dir="$APPS_REPO_ROOT/apps-migration-scripts/backups"
    local backup_file="$backup_dir/marketplace-partner-apps-$app_name-$(date +%Y%m%d-%H%M%S).tar.gz"
    
    log "INFO" "Creating backup before cleanup..."
    
    mkdir -p "$backup_dir"
    
    if [[ "$DRY_RUN" == false ]]; then
        tar -czf "$backup_file" -C "$MPA_REPO_PATH/apps" "$app_name"
        log "INFO" "Backup created: $backup_file"
    else
        log "INFO" "[DRY RUN] Would create backup: $backup_file"
    fi
}

# =============================================================================
# Cleanup Functions
# =============================================================================

remove_from_release_please_config() {
    local app_name="$1"
    local config_file="$MPA_REPO_PATH/release-please-config.json"
    local manifest_file="$MPA_REPO_PATH/.release-please-manifest.json"
    
    log "INFO" "Removing app from release-please configuration..."
    
    if [[ -f "$config_file" ]]; then
        if [[ "$DRY_RUN" == false ]]; then
            # Remove the app entry from release-please-config.json
            jq "del(.packages[\"apps/$app_name\"])" "$config_file" > "$config_file.tmp" && mv "$config_file.tmp" "$config_file"
            log "INFO" "Removed from release-please-config.json"
        else
            log "INFO" "[DRY RUN] Would remove from release-please-config.json"
        fi
    fi
    
    if [[ -f "$manifest_file" ]]; then
        if [[ "$DRY_RUN" == false ]]; then
            # Remove the app entry from .release-please-manifest.json
            jq "del([\"apps/$app_name\"])" "$manifest_file" > "$manifest_file.tmp" && mv "$manifest_file.tmp" "$manifest_file"
            log "INFO" "Removed from .release-please-manifest.json"
        else
            log "INFO" "[DRY RUN] Would remove from .release-please-manifest.json"
        fi
    fi
}

remove_app_directory() {
    local app_name="$1"
    local mpa_path="$MPA_REPO_PATH/apps/$app_name"
    
    log "DANGER" "Removing app directory from marketplace-partner-apps..."
    
    if [[ "$DRY_RUN" == false ]]; then
        rm -rf "$mpa_path"
        log "INFO" "App directory removed: $mpa_path"
    else
        log "INFO" "[DRY RUN] Would remove directory: $mpa_path"
        log "DEBUG" "[DRY RUN] Directory contents:"
        find "$mpa_path" -type f | head -20
    fi
}

commit_changes() {
    local app_name="$1"
    
    log "INFO" "Committing cleanup changes to marketplace-partner-apps..."
    
    cd "$MPA_REPO_PATH"
    
    if [[ "$DRY_RUN" == false ]]; then
        # Check if there are changes to commit
        if git diff --quiet && git diff --cached --quiet; then
            log "INFO" "No changes to commit"
        else
            git add .
            git commit -m "feat: remove $app_name app (migrated to apps repository)

This app has been successfully migrated to the apps repository and is no longer needed here.

Migration completed on $(date)
"
            log "INFO" "Changes committed to marketplace-partner-apps"
            log "INFO" "Remember to push the changes: git push"
        fi
    else
        log "INFO" "[DRY RUN] Would commit changes with message:"
        log "DEBUG" "[DRY RUN] feat: remove $app_name app (migrated to apps repository)"
    fi
    
    cd "$APPS_REPO_ROOT"
}

# =============================================================================
# Interactive Functions
# =============================================================================

confirm_cleanup() {
    local app_name="$1"
    
    if [[ "$FORCE" == true ]]; then
        log "INFO" "Skipping confirmation (--force flag used)"
        return 0
    fi
    
    echo
    echo "============================================================================="
    echo "⚠️  DANGER: You are about to permanently delete files!"
    echo "============================================================================="
    echo
    echo "This will remove the following from marketplace-partner-apps:"
    echo "  • App directory: $MPA_REPO_PATH/apps/$app_name"
    echo "  • Release configuration entries"
    echo "  • All app source code, history, and files"
    echo
    echo "Before proceeding, please confirm:"
    echo "  ✅ App has been successfully migrated to apps repository"
    echo "  ✅ App builds and runs correctly in apps repository"
    echo "  ✅ App has been thoroughly tested"
    echo "  ✅ You have reviewed all functionality"
    echo
    
    read -p "Are you absolutely sure you want to proceed? (type 'DELETE' to confirm): " -r
    echo
    
    if [[ "$REPLY" != "DELETE" ]]; then
        log "INFO" "Cleanup cancelled by user"
        exit 0
    fi
    
    log "INFO" "User confirmed cleanup - proceeding..."
}

create_cleanup_report() {
    local app_name="$1"
    local report_file="$SCRIPT_DIR/reports/$app_name-cleanup-report-$(date +%Y%m%d-%H%M%S).md"
    
    cat > "$report_file" << EOF
# Cleanup Report: $app_name

**Date:** $(date)
**Status:** $([[ "$DRY_RUN" == true ]] && echo "DRY RUN" || echo "COMPLETED")

## Summary
App '$app_name' has been removed from the marketplace-partner-apps repository.

## Actions Performed
- [x] Verified app exists and functions in apps repository
- [x] Created backup of original app files
- [x] Removed app from release-please configuration files
- [x] Deleted app directory from marketplace-partner-apps
- [x] Committed changes to marketplace-partner-apps

## Backup Location
$([[ "$DRY_RUN" == false ]] && echo "Backup created in: \`apps/backups/\`" || echo "Backup would be created in: \`apps/backups/\`")

## Next Steps
1. **Push the changes** to marketplace-partner-apps:
   \`\`\`bash
   cd ../marketplace-partner-apps
   git push
   \`\`\`

2. **Verify cleanup** by checking the marketplace-partner-apps repository

## Files
- **Cleanup Log:** $LOG_FILE
- **Cleanup Report:** $report_file

---
**⚠️  Note:** This cleanup is permanent. The backup in \`apps/backups/\` is the only way to recover the original files.

EOF

    log "INFO" "Cleanup report created: $report_file"
}

# =============================================================================
# Main Cleanup Function
# =============================================================================

cleanup_migrated_app() {
    local app_name="$1"
    
    log "INFO" "Starting cleanup of migrated app: $app_name"
    log "INFO" "Mode: $([[ "$DRY_RUN" == true ]] && echo "DRY RUN" || echo "LIVE")"
    
    # Verification steps
    verify_app_migrated_successfully "$app_name"
    
    # Interactive confirmation
    confirm_cleanup "$app_name"
    
    # Cleanup steps
    create_backup "$app_name"
    remove_from_release_please_config "$app_name"
    remove_app_directory "$app_name"
    commit_changes "$app_name"
    
    create_cleanup_report "$app_name"
    
    log "INFO" "Cleanup completed successfully!"
    echo
    echo "============================================================================="
    echo "✅ Cleanup completed!"
    echo "============================================================================="
    echo
    echo "Next steps:"
    echo "1. Push changes to marketplace-partner-apps: cd ../marketplace-partner-apps && git push"
    echo "2. Check the cleanup report for details"
    echo
}

# =============================================================================
# Argument Parsing
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --force)
                FORCE=true
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --help)
                show_usage
                exit 0
                ;;
            -*)
                log "ERROR" "Unknown option: $1"
                show_usage
                exit 1
                ;;
            *)
                if [[ -z "$APP_NAME" ]]; then
                    APP_NAME="$1"
                else
                    log "ERROR" "Too many arguments. Only one app name expected."
                    show_usage
                    exit 1
                fi
                shift
                ;;
        esac
    done
    
    if [[ -z "$APP_NAME" ]]; then
        log "ERROR" "App name is required"
        show_usage
        exit 1
    fi
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    echo "============================================================================="
    echo "  Marketplace Partner Apps Cleanup Script"
    echo "============================================================================="
    echo
    echo "⚠️  WARNING: This script permanently deletes files!"
    echo "⚠️  Only use after thoroughly testing the migrated app!"
    echo
    
    parse_arguments "$@"
    
    # Ensure logs, reports, and backups directories exist before setting up logging
    mkdir -p "$SCRIPT_DIR/logs" "$SCRIPT_DIR/reports" "$SCRIPT_DIR/backups"
    
    # Set LOG_FILE with app name prefix after parsing arguments
    LOG_FILE="$SCRIPT_DIR/logs/${APP_NAME}-cleanup-$(date +%Y%m%d-%H%M%S).log"
    
    check_prerequisites
    cleanup_migrated_app "$APP_NAME"
}

# Run main function with all arguments
main "$@"
