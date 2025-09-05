#!/bin/bash

# =============================================================================
# Marketplace Partner Apps to Apps Repository Migration Script
# =============================================================================
# This script transfers a marketplace-partner-apps app to the apps repository
# ensuring all necessary files, dependencies, and CI/CD configurations are 
# properly migrated and integrated.
#
# Usage: ./migrate-app.sh <app-name> [--dry-run] [--verbose]
# Example: ./migrate-app.sh amplitude-experiment
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MPA_REPO_PATH="../../marketplace-partner-apps"
TEMP_DIR="/tmp/app-migration-$$"
LOG_FILE="" # Will be set after app name is parsed

# Flags
DRY_RUN=false
VERBOSE=false
APP_NAME=""

# =============================================================================
# Utility Functions
# =============================================================================

log() {
    local level="$1"
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # Print to console
    case "$level" in
        "INFO")  echo "[INFO] $message" ;;
        "WARN")  echo "[WARN] $message" ;;
        "ERROR") echo "[ERROR] $message" ;;
        "DEBUG") [[ "$VERBOSE" == true ]] && echo "[DEBUG] $message" ;;
    esac
    
    # Write to log file with timestamp
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

show_usage() {
    cat << EOF
Usage: $0 <app-name> [options]

Transfer a marketplace-partner-apps app to the apps repository.

Arguments:
    app-name        Name of the app to transfer (must exist in marketplace-partner-apps/apps/)

Options:
    --dry-run       Show what would be done without making changes
    --verbose       Enable verbose logging
    --help         Show this help message

Examples:
    $0 amplitude-experiment
    $0 bynder --dry-run
    $0 shopify --verbose

Documentation:
    First time?     ./getting-started.sh
    Step-by-step:   cat USAGE_GUIDE.md
    Quick reference: ./migration-summary.sh

EOF
}

cleanup() {
    log "INFO" "Cleaning up temporary files..."
    [[ -d "$TEMP_DIR" ]] && rm -rf "$TEMP_DIR"
}

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
        log "ERROR" "Please ensure marketplace-partner-apps is cloned alongside the apps repository"
        exit 1
    fi
    
    # Check required tools
    local required_tools=("node" "npm" "git" "jq")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log "ERROR" "Required tool '$tool' not found in PATH"
            exit 1
        fi
    done
    
    # Check Node.js version compatibility
    local node_version=$(node --version | sed 's/v//')
    local major_version=$(echo "$node_version" | cut -d. -f1)
    if [[ "$major_version" -lt 16 ]]; then
        log "ERROR" "Node.js version 16 or higher required (current: $node_version)"
        exit 1
    fi
    
    log "INFO" "Prerequisites check passed"
}

validate_app_exists() {
    local app_name="$1"
    local mpa_app_path="$MPA_REPO_PATH/apps/$app_name"
    
    if [[ ! -d "$mpa_app_path" ]]; then
        log "ERROR" "App '$app_name' not found in marketplace-partner-apps/apps/"
        log "INFO" "Available apps:"
        ls -1 "$MPA_REPO_PATH/apps/" | grep -v "^$" | head -10
        exit 1
    fi
    
    if [[ ! -f "$mpa_app_path/package.json" ]]; then
        log "ERROR" "App '$app_name' does not have a package.json file"
        exit 1
    fi
    
    log "INFO" "App '$app_name' found and validated"
}

check_app_not_exists_in_apps() {
    local app_name="$1"
    local apps_app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    if [[ -d "$apps_app_path" ]]; then
        log "ERROR" "App '$app_name' already exists in apps repository"
        log "ERROR" "Please remove it manually or choose a different name"
        exit 1
    fi
}

create_temp_workspace() {
    log "INFO" "Creating temporary workspace at $TEMP_DIR"
    mkdir -p "$TEMP_DIR"
    trap cleanup EXIT
}

copy_app_files() {
    local app_name="$1"
    local source_path="$MPA_REPO_PATH/apps/$app_name"
    local temp_app_path="$TEMP_DIR/$app_name"
    
    log "INFO" "Copying app files from marketplace-partner-apps..."
    
    # Copy all files except node_modules, build directories, and git files
    rsync -av \
        --exclude="node_modules/" \
        --exclude="build/" \
        --exclude="dist/" \
        --exclude=".git/" \
        --exclude="*.log" \
        "$source_path/" \
        "$temp_app_path/"
    
    log "DEBUG" "Files copied to temporary location: $temp_app_path"
}

adapt_package_json() {
    local app_name="$1"
    local temp_app_path="$TEMP_DIR/$app_name"
    local package_json="$temp_app_path/package.json"
    
    log "INFO" "Adapting package.json for apps repository structure..."
    
    # Read original package.json
    local original_json=$(cat "$package_json")
    
    # Create updated package.json with apps repository conventions
    echo "$original_json" | jq '
        # Update name to include @contentful scope if not present
        .name = if (.name | startswith("@contentful/")) then .name else "@contentful/" + .name end |
        
        # Add/update scripts for apps repository conventions
        .scripts = (.scripts // {}) + {
            "test:ci": (.scripts.test // "vitest"),
            "verify-config": (.scripts["verify-config"] // "echo \"No config verification needed\"")
        } |
        
        # Ensure required scripts exist
        .scripts = (.scripts // {}) + {
            "start": (.scripts.start // "vite"),
            "build": (.scripts.build // "tsc && vite build"),
            "test": (.scripts.test // "vitest")
        } |
        
        # Update deploy scripts to match apps repository pattern (remove for now)
        .scripts = .scripts | del(.deploy) | del(."deploy:staging") | del(."deploy:production") |
        
        # Ensure @contentful/app-scripts version is compatible with apps repo
        .dependencies = (.dependencies // {}) |
        .devDependencies = (.devDependencies // {})
    ' > "$package_json.tmp" && mv "$package_json.tmp" "$package_json"
    
    log "DEBUG" "package.json adapted for apps repository"
}

add_missing_config_files() {
    local app_name="$1"
    local temp_app_path="$TEMP_DIR/$app_name"
    
    log "INFO" "Adding missing configuration files..."
    
    # Add tsconfig.json if missing
    if [[ ! -f "$temp_app_path/tsconfig.json" ]]; then
        log "DEBUG" "Adding default tsconfig.json"
        cat > "$temp_app_path/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF
    fi
    
    # Add vite.config if missing (and app appears to use Vite)
    if [[ ! -f "$temp_app_path/vite.config.ts" ]] && [[ ! -f "$temp_app_path/vite.config.js" ]] && [[ ! -f "$temp_app_path/vite.config.mjs" ]]; then
        if grep -q "vite" "$temp_app_path/package.json"; then
            log "DEBUG" "Adding default vite.config.ts"
            cat > "$temp_app_path/vite.config.ts" << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build'
  },
  server: {
    port: 3000
  }
});
EOF
        fi
    fi
    
    # Add vitest.config if missing and tests exist
    if [[ -d "$temp_app_path/test" ]] || [[ -d "$temp_app_path/tests" ]] || [[ -d "$temp_app_path/src/__tests__" ]]; then
        if [[ ! -f "$temp_app_path/vitest.config.ts" ]] && [[ ! -f "$temp_app_path/vitest.config.js" ]]; then
            log "DEBUG" "Adding default vitest.config.ts"
            cat > "$temp_app_path/vitest.config.ts" << 'EOF'
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    setupFiles: ['./test/setup.ts']
  }
});
EOF
        fi
    fi
    
    # Fix existing tsconfig.json for apps repository compatibility
    if [[ -f "$temp_app_path/tsconfig.json" ]]; then
        log "DEBUG" "Fixing existing tsconfig.json for apps repository compatibility"
        
        # Read and fix tsconfig.json
        local tsconfig_content=$(cat "$temp_app_path/tsconfig.json")
        
        # Replace vitest/globals with node in types array
        echo "$tsconfig_content" | jq '
            if .compilerOptions.types then
                .compilerOptions.types = (.compilerOptions.types | map(if . == "vitest/globals" then "node" else . end))
            else
                .
            end
        ' > "$temp_app_path/tsconfig.json.tmp" && mv "$temp_app_path/tsconfig.json.tmp" "$temp_app_path/tsconfig.json"
        
        log "DEBUG" "Fixed tsconfig.json types configuration"
        
        # Fix test files that use vi globals without imports
        if [[ -d "$temp_app_path/test" ]]; then
            log "DEBUG" "Fixing vi imports in test files..."
            find "$temp_app_path/test" -name "*.ts" -o -name "*.tsx" | while read -r test_file; do
                if grep -q "vi\." "$test_file" && ! grep -q "import.*vi.*from.*vitest" "$test_file"; then
                    log "DEBUG" "Adding vi import to $test_file"
                    # Add import to the top of the file
                    sed -i.bak '1i\
import { vi } from '\''vitest'\'';
' "$test_file" && rm "$test_file.bak"
                fi
            done
        fi
    fi
    
    # Check if lint script exists and inform user if missing
    if ! jq -e '.scripts.lint' "$temp_app_path/package.json" >/dev/null 2>&1; then
        log "WARN" "No lint script found - consider adding one manually for better code quality"
    fi
}

update_dependencies() {
    local app_name="$1"
    local temp_app_path="$TEMP_DIR/$app_name"
    
    log "INFO" "Updating dependencies to match apps repository standards..."
    
    cd "$temp_app_path"
    
    # Update package-lock.json by running npm install
    if [[ "$DRY_RUN" == false ]]; then
        log "DEBUG" "Running npm install to update dependencies..."
        npm install --package-lock-only
    fi
    
    cd - > /dev/null
}

migrate_app_to_apps_repo() {
    local app_name="$1"
    local temp_app_path="$TEMP_DIR/$app_name"
    local target_path="$APPS_REPO_ROOT/apps/$app_name"
    
    log "INFO" "Migrating app to apps repository..."
    
    if [[ "$DRY_RUN" == false ]]; then
        # Create target directory
        mkdir -p "$target_path"
        
        # Copy all files
        cp -r "$temp_app_path/"* "$target_path/"
        
        # Ensure proper permissions
        find "$target_path" -type f -name "*.sh" -exec chmod +x {} \;
        
        log "INFO" "App successfully migrated to $target_path"
    else
        log "INFO" "[DRY RUN] Would migrate app to $target_path"
        log "DEBUG" "[DRY RUN] Files that would be copied:"
        find "$temp_app_path" -type f | head -20
    fi
}

run_post_migration_setup() {
    local app_name="$1"
    local target_path="$APPS_REPO_ROOT/apps/$app_name"
    
    log "INFO" "Running post-migration setup..."
    
    if [[ "$DRY_RUN" == false ]]; then
        cd "$APPS_REPO_ROOT"
        
        # Run lerna bootstrap to set up the new app
        log "INFO" "Running lerna bootstrap for the new app..."
        npm run bootstrap
        
        # Install dependencies in the migrated app
        log "INFO" "Installing dependencies in migrated app..."
        cd "$target_path"
        npm install
        
        # Try to build the app to verify it works
        log "INFO" "Testing app build..."
        npm run build || log "WARN" "App build failed - manual fixes may be required"
        
        cd "$APPS_REPO_ROOT"
        
        log "INFO" "Post-migration setup completed"
    else
        log "INFO" "[DRY RUN] Would run lerna bootstrap and test build"
    fi
}

create_migration_report() {
    local app_name="$1"
    local report_file
    if [[ "$DRY_RUN" == true ]]; then
        report_file="$SCRIPT_DIR/reports/$app_name-migration-dry-run-report-$(date +%Y%m%d-%H%M%S).md"
    else
        report_file="$SCRIPT_DIR/reports/$app_name-migration-report-$(date +%Y%m%d-%H%M%S).md"
    fi
    
    cat > "$report_file" << EOF
# Migration Report: $app_name

**Date:** $(date)
**Status:** $([[ "$DRY_RUN" == true ]] && echo "DRY RUN" || echo "COMPLETED")

## Summary
App '$app_name' has been migrated from marketplace-partner-apps to the apps repository.

## Changes Made
- [x] Copied all source files excluding build artifacts
- [x] Adapted package.json for apps repository conventions
- [x] Added missing configuration files
- [x] Updated dependencies
- [x] Migrated to apps/apps/$app_name

## Next Steps
1. **Review the migrated app** in \`apps/apps/$app_name\`
2. **Test the app** by running:
   \`\`\`bash
   cd apps/$app_name
   npm start
   \`\`\`
3. **Update CI/CD configurations** if needed
4. **Run cleanup script** after verification:
   \`\`\`bash
   ./cleanup-migrated-app.sh $app_name
   \`\`\`

## Verification Checklist
- [ ] App builds successfully (\`npm run build\`)
- [ ] App starts successfully (\`npm start\`)
- [ ] Tests pass (\`npm test\`)
- [ ] Linting passes (\`npm run lint\`)
- [ ] App functions correctly in Contentful

## Files
- **Migration Log:** $LOG_FILE
- **Migration Report:** $report_file

EOF

    log "INFO" "Migration report created: $report_file"
}

# =============================================================================
# Main Migration Function
# =============================================================================

migrate_app() {
    local app_name="$1"
    
    log "INFO" "Starting migration of app: $app_name"
    log "INFO" "Mode: $([[ "$DRY_RUN" == true ]] && echo "DRY RUN" || echo "LIVE")"
    
    # Validation steps
    validate_app_exists "$app_name"
    check_app_not_exists_in_apps "$app_name"
    
    # Migration steps
    create_temp_workspace
    copy_app_files "$app_name"
    adapt_package_json "$app_name"
    add_missing_config_files "$app_name"
    update_dependencies "$app_name"
    migrate_app_to_apps_repo "$app_name"
    
    if [[ "$DRY_RUN" == false ]]; then
        run_post_migration_setup "$app_name"
    fi
    
    create_migration_report "$app_name"
    
    log "INFO" "Migration completed successfully!"
    log "INFO" "Check the migration report for next steps"
}

# =============================================================================
# Argument Parsing
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            --verbose)
                VERBOSE=true
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
    echo "  Marketplace Partner Apps to Apps Repository Migration Script"
    echo "============================================================================="
    echo
    
    parse_arguments "$@"
    
    # Ensure logs and reports directories exist before setting up logging
    mkdir -p "$SCRIPT_DIR/logs" "$SCRIPT_DIR/reports"
    
    # Set LOG_FILE with app name prefix after parsing arguments
    if [[ "$DRY_RUN" == true ]]; then
        LOG_FILE="$SCRIPT_DIR/logs/${APP_NAME}-migration-dry-run-$(date +%Y%m%d-%H%M%S).log"
    else
        LOG_FILE="$SCRIPT_DIR/logs/${APP_NAME}-migration-$(date +%Y%m%d-%H%M%S).log"
    fi
    
    check_prerequisites
    migrate_app "$APP_NAME"
    
    echo
    echo "============================================================================="
    echo "  Migration completed! Check the migration report for next steps."
    echo "============================================================================="
}

# Run main function with all arguments
main "$@"
