# 🔧 Technical Reference

Advanced technical details, customization, and internals of the migration scripts.

> **Looking for basic usage?** Check `GETTING_STARTED.md` or `USAGE_GUIDE.md` instead.

## 🏗 Script Architecture

### Directory Structure and Paths

The scripts automatically detect their location and set paths relative to:

```bash
# Script location detection
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MPA_REPO_PATH="../../marketplace-partner-apps"
```

**Path Configuration:**
- **Apps repository root**: `../` (parent directory)
- **Marketplace-partner-apps**: `../../marketplace-partner-apps`
- **Logs directory**: `logs/`
- **Backups directory**: `backups/`

### File Organization

```
apps-migration-scripts/
├── logs/                          # All script logs (with app name prefix)
│   ├── <app-name>-migration-YYYYMMDD-HHMMSS.log
│   ├── <app-name>-validation-YYYYMMDD-HHMMSS.log
│   └── <app-name>-cleanup-YYYYMMDD-HHMMSS.log
├── reports/                       # Migration reports (organized by app)
│   ├── <app-name>-migration-report-YYYYMMDD-HHMMSS.md
│   ├── <app-name>-validation-report-YYYYMMDD-HHMMSS.md
│   └── <app-name>-cleanup-report-YYYYMMDD-HHMMSS.md
└── backups/                       # Cleanup backups
    └── marketplace-partner-apps-<app>-YYYYMMDD-HHMMSS.tar.gz
```

## 🔄 Migration Process Internals

### Phase 1: Migration (`migrate-app.sh`)

**1. Prerequisites Check:**
- Validates directory structure
- Checks required tools (node, npm, git, jq)
- Verifies repository accessibility

**2. File Transfer:**
```bash
# Excludes build artifacts and dependencies
rsync -av \
    --exclude="node_modules/" \
    --exclude="build/" \
    --exclude="dist/" \
    --exclude=".git/" \
    --exclude="*.log" \
    "$source_path/" \
    "$temp_app_path/"
```

**3. Package.json Adaptation:**
```bash
# Updates using jq for reliable JSON manipulation
echo "$original_json" | jq '
    # Update name to include @contentful scope
    .name = if (.name | startswith("@contentful/")) then .name else "@contentful/" + .name end |
    
    # Add/update scripts for apps repository conventions
    .scripts = (.scripts // {}) + {
        "test:ci": (.scripts.test // "vitest"),
        "lint": (.scripts.lint // "eslint src --max-warnings 0"),
        "verify-config": (.scripts["verify-config"] // "echo \"No config verification needed\"")
    } |
    
    # Remove marketplace-partner-apps specific scripts
    # Note: install-ci is kept as it's a legitimate script in apps repository
' > "$package_json.tmp"
```

**4. Configuration File Addition:**
- `tsconfig.json` (if missing and using TypeScript)
- `vite.config.ts` (if missing and using Vite)
- `vitest.config.ts` (if tests exist but no config)

### Phase 2: Validation (`validate-migration.sh`)

**Test Categories:**

1. **File Structure Validation**
   - Required files exist
   - Source directory structure
   - Build configuration presence

2. **Package.json Validation**
   - Required scripts exist
   - Naming conventions
   - Dependencies structure

3. **Dependencies Validation**
   - Installation succeeds
   - Security audit passes
   - Version compatibility

4. **Build Process Validation**
   - App builds successfully
   - Build artifacts created
   - Asset compilation

5. **Integration Validation**
   - Lerna recognition
   - Bootstrap process
   - Build system integration

### Phase 3: Cleanup (`cleanup-migrated-app.sh`)

**Safety Mechanisms:**
1. Verifies app exists and works in apps repository
2. Creates timestamped backup
3. Requires explicit "DELETE" confirmation
4. Updates release configuration atomically
5. Commits changes with descriptive message

## 🛠 Customization Points

### Environment Variables

```bash
# Override default paths
export MPA_REPO_PATH="/custom/path/to/marketplace-partner-apps"
export APPS_REPO_ROOT="/custom/path/to/apps"

# Customize log levels
export VERBOSE=true
export DEBUG=true
```

### Script Modification

**Add Custom Validation Rules:**
```bash
# In validate-migration.sh, add to validate_custom function
validate_custom() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    # Custom validation logic
    run_test "Custom check" "your_validation_command"
}
```

**Extend Package.json Adaptation:**
```bash
# In migrate-app.sh, modify the jq transformation
.scripts = (.scripts // {}) + {
    "your-custom-script": "your-command"
}
```

### Log Configuration

**Adjust Logging Levels:**
```bash
# In any script, modify log function calls
log() {
    local level="$1"
    shift
    local message="$@"
    
    # Add custom log levels or formatting
    case "$level" in
        "CUSTOM") echo -e "${CUSTOM_COLOR}[CUSTOM]${NC} $message" ;;
    esac
}
```

## 🔍 Troubleshooting Internals

### Common Failure Points

**1. Path Resolution Issues**
```bash
# Debug path detection
echo "SCRIPT_DIR: $SCRIPT_DIR"
echo "APPS_REPO_ROOT: $APPS_REPO_ROOT" 
echo "MPA_REPO_PATH: $MPA_REPO_PATH"
```

**2. Permission Problems**
```bash
# Check file permissions
find "$target_path" -type f -name "*.sh" -exec chmod +x {} \;
```

**3. JSON Parsing Errors**
```bash
# Validate JSON before processing
jq empty "$package_json" || {
    log "ERROR" "Invalid JSON in $package_json"
    exit 1
}
```

### Debug Mode

Enable comprehensive debugging:
```bash
# Run any script with debug tracing
bash -x ./migrate-app.sh app-name --verbose
```

### Log Analysis

**Parse Logs for Specific Issues:**
```bash
# Find all error messages
grep "\[ERROR\]" logs/migration-*.log

# Find specific operation failures
grep "npm run build" logs/validation-*.log

# Check timing information
grep "$(date +%Y-%m-%d)" logs/*.log
```

## 📊 Performance Considerations

### Optimization Strategies

**1. Parallel Operations**
```bash
# Multiple validations can run in parallel
validate_file_structure "$app_name" &
validate_dependencies "$app_name" &
wait  # Wait for all background jobs
```

**2. Caching**
```bash
# Cache dependency installations
export NPM_CONFIG_CACHE="/tmp/npm-cache"
```

**3. Incremental Operations**
```bash
# Skip unchanged operations
if [[ "$package_json" -nt "$package_json.backup" ]]; then
    # Package.json changed, re-process
fi
```

### Resource Management

**Cleanup Temporary Files:**
```bash
cleanup() {
    log "INFO" "Cleaning up temporary files..."
    [[ -d "$TEMP_DIR" ]] && rm -rf "$TEMP_DIR"
}
trap cleanup EXIT
```

## 🔒 Security Considerations

### Input Validation

```bash
# Validate app names
validate_app_name() {
    local app_name="$1"
    
    # Check for path traversal
    if [[ "$app_name" =~ \.\./|\.\. ]]; then
        log "ERROR" "Invalid app name: $app_name"
        exit 1
    fi
    
    # Check for special characters
    if [[ ! "$app_name" =~ ^[a-zA-Z0-9_-]+$ ]]; then
        log "ERROR" "App name contains invalid characters: $app_name"
        exit 1
    fi
}
```

### File Operations

```bash
# Safe file operations
safe_copy() {
    local src="$1"
    local dest="$2"
    
    # Validate source exists
    [[ -e "$src" ]] || {
        log "ERROR" "Source does not exist: $src"
        return 1
    }
    
    # Create destination directory safely
    mkdir -p "$(dirname "$dest")"
    
    # Copy with verification
    cp "$src" "$dest" && {
        log "DEBUG" "Copied: $src -> $dest"
    }
}
```

### Backup Integrity

```bash
# Verify backup creation
verify_backup() {
    local backup_file="$1"
    local original_dir="$2"
    
    # Check backup exists and is not empty
    [[ -f "$backup_file" && -s "$backup_file" ]] || {
        log "ERROR" "Backup creation failed or file is empty"
        return 1
    }
    
    # Verify backup contents
    tar -tzf "$backup_file" >/dev/null || {
        log "ERROR" "Backup file is corrupted"
        return 1
    }
}
```

## 📈 Monitoring and Metrics

### Operation Tracking

```bash
# Track operation timing
start_time=$(date +%s)
# ... operation ...
end_time=$(date +%s)
duration=$((end_time - start_time))
log "INFO" "Operation completed in ${duration}s"
```

### Success Metrics

```bash
# Track migration success rates
record_migration_result() {
    local app_name="$1"
    local result="$2"  # success/failure
    
    echo "$(date +%Y-%m-%d %H:%M:%S),$app_name,$result" >> migration-metrics.csv
}
```

---

This technical reference covers the internals and advanced customization options. For day-to-day usage, refer to the other documentation files.
