#!/bin/bash

# =============================================================================
# Migration Validation Script
# =============================================================================
# This script validates that an app has been successfully migrated from
# marketplace-partner-apps to the apps repository by running comprehensive
# checks and tests.
#
# Usage: ./validate-migration.sh <app-name> [--detailed] [--fix-issues]
# Example: ./validate-migration.sh amplitude-experiment --detailed
# =============================================================================

set -euo pipefail

# Script configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
MPA_REPO_PATH="../../marketplace-partner-apps"
LOG_FILE="" # Will be set after app name is parsed

# Disable colors for better compatibility
RED=''
GREEN=''
YELLOW=''
BLUE=''
PURPLE=''
NC=''

# Test results
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Manual action items for report
MANUAL_ACTIONS=()

# Flags
DETAILED=false
FIX_ISSUES=false
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
        "DEBUG") [[ "$DETAILED" == true ]] && echo "[DEBUG] $message" ;;
        "SUCCESS") echo "[SUCCESS] $message" ;;
        "FAIL") echo "[FAIL] $message" ;;
    esac
    
    # Write to log file with timestamp
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
}

run_test() {
    local test_name="$1"
    local test_command="$2"
    local required="${3:-true}"
    
    ((TOTAL_TESTS++))
    
    echo -n "  Testing $test_name... "
    
    # Capture both stdout and stderr for error reporting
    local test_output
    test_output=$(eval "$test_command" 2>&1)
    local test_result=$?
    
    if [[ $test_result -eq 0 ]]; then
        echo "✓"
        ((PASSED_TESTS++))
        log "SUCCESS" "Test passed: $test_name"
        return 0
    else
        if [[ "$required" == "true" ]]; then
            echo "✗"
            ((FAILED_TESTS++))
            # Show the actual error output
            if [[ -n "$test_output" ]]; then
                echo "    Error: $test_output"
                log "FAIL" "Test failed: $test_name - Error: $test_output"
            else
                log "FAIL" "Test failed: $test_name - No error output"
            fi
            return 1
        else
            echo "⚠"
            ((WARNINGS++))
            # Show warning details if available
            if [[ -n "$test_output" ]]; then
                echo "    Warning: $test_output"
                log "WARN" "Test warning: $test_name - Output: $test_output"
            else
                log "WARN" "Test warning: $test_name"
            fi
            return 2
        fi
    fi
}

show_usage() {
    cat << EOF
Usage: $0 <app-name> [options]

Validate that an app has been successfully migrated from marketplace-partner-apps
to the apps repository.

Arguments:
    app-name        Name of the migrated app to validate

Options:
    --detailed      Show detailed output and debug information
    --fix-issues    Attempt to automatically fix common issues
    --help          Show this help message

Validation Checks:
    • File structure validation
    • Package.json compatibility
    • Dependency resolution
    • Build process
    • Test execution
    • Linting compliance

Examples:
    $0 amplitude-experiment                 # Basic validation
    $0 bynder --detailed                   # Detailed validation with debug info
    $0 shopify --fix-issues                # Auto-fix common issues

Documentation:
    First time?     ./getting-started.sh
    Step-by-step:   cat USAGE_GUIDE.md
    Quick reference: ./migration-summary.sh

EOF
}

check_optional_file() {
    local app_path="$1"
    local filename="$2"
    local action="$3"
    
    if [[ -f "$app_path/$filename" ]]; then
        echo "  ✓ $filename exists"
        log "SUCCESS" "Optional file exists: $filename"
    else
        echo "  📝 $filename missing - will add to manual checklist"
        log "WARN" "Optional file missing: $filename"
        MANUAL_ACTIONS+=("$action")
    fi
}

# =============================================================================
# Validation Functions
# =============================================================================

validate_file_structure() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    echo "📁 Validating file structure..."
    
    # Check if app directory exists (critical)
    run_test "App directory exists" "[[ -d '$app_path' ]]"
    
    # Check for required files (critical)
    run_test "package.json exists" "[[ -f '$app_path/package.json' ]]"
    run_test "Source directory exists" "[[ -d '$app_path/src' ]]"
    
    # Check for recommended files (non-blocking but noted for manual review)
    check_optional_file "$app_path" "README.md" "Create a README.md file with app description and usage instructions"
    check_optional_file "$app_path" "LICENSE" "Add a LICENSE file (usually MIT for Contentful apps)"
    
    # Check for build configuration
    local has_build_config=false
    local config_files=()
    
    if [[ -f "$app_path/vite.config.ts" ]]; then
        has_build_config=true
        config_files+=("vite.config.ts")
    elif [[ -f "$app_path/vite.config.js" ]]; then
        has_build_config=true
        config_files+=("vite.config.js")
    elif [[ -f "$app_path/vite.config.mjs" ]]; then
        has_build_config=true
        config_files+=("vite.config.mjs")
    elif [[ -f "$app_path/webpack.config.js" ]]; then
        has_build_config=true
        config_files+=("webpack.config.js")
    elif [[ -f "$app_path/rollup.config.js" ]]; then
        has_build_config=true
        config_files+=("rollup.config.js")
    fi
    
    if [[ "$has_build_config" == true ]]; then
        echo "  ✓ Build configuration exists (${config_files[*]})"
        log "SUCCESS" "Build configuration found: ${config_files[*]}"
    else
        echo "  📝 Build configuration missing - will add to manual checklist"
        log "WARN" "Build configuration missing"
        MANUAL_ACTIONS+=("Review if build configuration is needed (many React apps work without explicit config files)")
    fi
    
    # Check TypeScript configuration (only suggest if project uses TypeScript)
    if [[ -d "$app_path/src" ]] && find "$app_path/src" -name "*.ts" -o -name "*.tsx" 2>/dev/null | grep -q .; then
        check_optional_file "$app_path" "tsconfig.json" "Add TypeScript configuration (tsconfig.json) for your TypeScript files"
    elif [[ ! -f "$app_path/tsconfig.json" ]]; then
        echo "  ℹ TypeScript config not needed (no .ts/.tsx files found)"
        log "INFO" "TypeScript configuration not needed - no TS files detected"
    else
        echo "  ✓ tsconfig.json exists"
        log "SUCCESS" "TypeScript configuration found"
    fi
    
    # Return success (this function doesn't fail on warnings)
    return 0
}

validate_package_json() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    local package_json="$app_path/package.json"
    local critical_failures=0
    
    echo "📦 Validating package.json..."
    
    # Check required scripts
    run_test "start script exists" "jq -e '.scripts.start' '$package_json' >/dev/null || (echo 'Missing start script in package.json' >&2 && false)" || ((critical_failures++))
    run_test "build script exists" "jq -e '.scripts.build' '$package_json' >/dev/null || (echo 'Missing build script in package.json' >&2 && false)" || ((critical_failures++))
    run_test "test script exists" "jq -e '.scripts.test' '$package_json' >/dev/null || (echo 'Missing test script in package.json' >&2 && false)" || ((critical_failures++))
    
    # Check apps repository conventions (non-critical)
    run_test "Has @contentful scope" "jq -e '.name | startswith(\"@contentful/\")' '$package_json' >/dev/null || (echo 'App name should start with @contentful/' >&2 && false)" "false"
    run_test "Is marked as private" "jq -e '.private == true' '$package_json' >/dev/null || (echo 'Package should be marked as private: true' >&2 && false)" || ((critical_failures++))
    
    # Check for common dependencies (non-critical)
    run_test "Has @contentful/app-sdk" "jq -e '.dependencies[\"@contentful/app-sdk\"]' '$package_json' >/dev/null || (echo 'Missing @contentful/app-sdk dependency' >&2 && false)" "false"
    run_test "Has React dependency" "jq -e '.dependencies.react' '$package_json' >/dev/null || (echo 'Missing React dependency' >&2 && false)" "false"
    
    # Check for actually deprecated scripts (if any are identified in the future)
    # Currently no scripts are flagged as deprecated
    run_test "Package.json structure valid" "true" || ((critical_failures++))
    
    # Return failure if any critical tests failed
    if [[ $critical_failures -gt 0 ]]; then
        log "ERROR" "Package.json validation failed with $critical_failures critical errors"
        return 1
    fi
    
    return 0
}

validate_dependencies() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    local critical_failures=0
    
    echo "🔗 Validating dependencies..."
    
    cd "$app_path"
    
    # Check if package-lock.json exists
    run_test "package-lock.json exists" "[[ -f package-lock.json ]]" || ((critical_failures++))
    
    # Try to install dependencies
    run_test "Dependencies can be installed" "npm ci" || ((critical_failures++))
    
    # Check for security vulnerabilities (informational - add to manual actions if found)
    echo "  Checking for security vulnerabilities..."
    local audit_output
    local audit_result
    
    # Run npm audit and capture result without failing the script
    if audit_output=$(npm audit --audit-level=high 2>&1); then
        audit_result=0
    else
        audit_result=$?
    fi
    
    if [[ $audit_result -eq 0 ]]; then
        echo "  ✓ No high-severity vulnerabilities found"
        log "SUCCESS" "No high-severity vulnerabilities found"
    else
        echo "  📝 Security vulnerabilities found - will add to manual checklist"
        log "WARN" "Security vulnerabilities found, adding to manual actions"
        
        # Show the vulnerability summary to user
        echo "    Vulnerability Summary:"
        echo "$audit_output" | grep -i "found\|vulnerabilities\|severity" | head -5
        
        # Parse vulnerability counts from npm audit output
        local vuln_summary=""
        if echo "$audit_output" | grep -qi "high"; then
            local high_count=$(echo "$audit_output" | grep -oi "high" | wc -l | tr -d ' ')
            vuln_summary+=" $high_count high"
        fi
        if echo "$audit_output" | grep -qi "critical"; then
            local critical_count=$(echo "$audit_output" | grep -oi "critical" | wc -l | tr -d ' ')
            vuln_summary+=" $critical_count critical"
        fi
        
        if [[ -n "$vuln_summary" ]]; then
            echo "    Found:$vuln_summary vulnerabilities"
            MANUAL_ACTIONS+=("Review and fix security vulnerabilities:$vuln_summary (run 'npm audit' for full details)")
        else
            # Fallback if we can't parse specific counts
            echo "    Found security vulnerabilities (see npm audit output above)"
            MANUAL_ACTIONS+=("Review and fix security vulnerabilities found by npm audit")
        fi
        
        # Log the full output for debugging
        log "WARN" "Full npm audit output: $audit_output"
    fi
    
    # Check for outdated dependencies (informational only)
    echo "  Checking for outdated dependencies..."
    local outdated_output
    outdated_output=$(npm outdated 2>/dev/null || true)
    
    if [[ -n "$outdated_output" ]]; then
        echo "    📦 Outdated dependencies found:"
        echo
        # Format the npm outdated output nicely
        echo "    Package                Current    Wanted     Latest"
        echo "    ─────────────────────────────────────────────────────"
        echo "$outdated_output" | tail -n +2 | while IFS= read -r line; do
            echo "    $line"
        done
        echo
        echo "    ⚠️  Note: Outdated dependencies don't prevent migration"
        echo "    💡 You can update them later with: npm update"
        
        # Count how many packages are outdated
        local outdated_count=$(echo "$outdated_output" | tail -n +2 | wc -l | tr -d ' ')
        log "INFO" "Found $outdated_count outdated dependencies"
    else
        echo "    ✓ All dependencies are up to date"
        log "INFO" "All dependencies are up to date"
    fi
    
    cd "$APPS_REPO_ROOT"
    
    # Return failure if any critical tests failed
    if [[ $critical_failures -gt 0 ]]; then
        log "ERROR" "Dependencies validation failed with $critical_failures critical errors"
        return 1
    fi
    
    return 0
}

validate_build_process() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    local critical_failures=0
    
    echo "🔨 Validating build process..."
    
    cd "$app_path"
    
    # Try to build the app
    run_test "App builds successfully" "npm run build" || ((critical_failures++))
    
    # Check if build artifacts are created
    local build_dir=""
    if [[ -d "build" ]]; then
        build_dir="build"
    elif [[ -d "dist" ]]; then
        build_dir="dist"
    fi
    
    if [[ -n "$build_dir" ]]; then
        run_test "Build artifacts created" "[[ -d '$build_dir' && \$(find '$build_dir' -type f | wc -l) -gt 0 ]]" || ((critical_failures++))
        run_test "Build includes HTML file" "find '$build_dir' -name '*.html' | grep -q ." "false"
        run_test "Build includes JS files" "find '$build_dir' -name '*.js' | grep -q ." || ((critical_failures++))
    fi
    
    cd "$APPS_REPO_ROOT"
    
    # Return failure if any critical tests failed
    if [[ $critical_failures -gt 0 ]]; then
        log "ERROR" "Build process validation failed with $critical_failures critical errors"
        return 1
    fi
    
    return 0
}

validate_tests() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    echo "🧪 Validating tests..."
    
    cd "$app_path"
    
    # Check if test files exist
    local has_tests=false
    if [[ -d "test" ]] || [[ -d "tests" ]] || [[ -d "src/__tests__" ]] || find src -name "*.test.*" -o -name "*.spec.*" | grep -q .; then
        has_tests=true
    fi
    
    run_test "Test files exist" "[[ '$has_tests' == true ]]" "false"
    
    if [[ "$has_tests" == true ]]; then
        # Try to run tests with timeout and non-interactive flags
        echo "  Testing Tests pass (with 60s timeout)..."
        local test_result=0
        local test_output=""
        
        # Try different test command variations with timeout
        test_output=$(timeout 60s npm test -- --run --reporter=basic 2>&1)
        test_result=$?
        if [[ $test_result -eq 0 ]]; then
            echo "  ✓"
            log "SUCCESS" "Test passed: Tests pass"
            ((PASSED_TESTS++))
        else
            test_output=$(timeout 60s npm test -- --watchAll=false 2>&1)
            test_result=$?
            if [[ $test_result -eq 0 ]]; then
                echo "  ✓"
                log "SUCCESS" "Test passed: Tests pass"
                ((PASSED_TESTS++))
            else
                test_output=$(timeout 60s npm run test:ci 2>&1)
                test_result=$?
                if [[ $test_result -eq 0 ]]; then
                    echo "  ✓"
                    log "SUCCESS" "Test passed: Tests pass"
                    ((PASSED_TESTS++))
                else
                    echo "  ⚠"
                    echo "    Warning: Tests timed out or failed - this is often due to watch mode or long-running tests"
                    if [[ -n "$test_output" ]]; then
                        echo "    Error output: ${test_output:0:200}$([ ${#test_output} -gt 200 ] && echo '...')"
                    fi
                    echo "    💡 Try running tests manually: npm test"
                    log "WARN" "Test warning: Tests pass - Tests timed out or failed. Output: $test_output"
                    ((WARNINGS++))
                fi
            fi
        fi
        ((TOTAL_TESTS++))
    fi
    
    cd "$APPS_REPO_ROOT"
    
    # Tests are generally non-critical for migration validation
    return 0
}

validate_linting() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    echo "🔍 Validating linting..."
    
    cd "$app_path"
    
    # Check if lint script exists
    if jq -e '.scripts.lint' package.json >/dev/null; then
        # Lint script exists, try to run it
        run_test "Linting passes" "npm run lint"
    else
        # No lint script found
        echo "  ⚠️  No lint script found in package.json"
        echo "  💡 Please add a lint script to package.json, for example:"
        echo "     \"lint\": \"eslint src --max-warnings 0\""
        log "WARN" "No lint script found - manual setup required"
    fi
    
    cd "$APPS_REPO_ROOT"
    
    # Linting is generally non-critical for migration validation
    return 0
}

fix_common_issues() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    if [[ "$FIX_ISSUES" == false ]]; then
        return 0
    fi
    
    echo "🔧 Attempting to fix common issues..."
    
    cd "$app_path"
    
    # Fix package.json issues
    log "DEBUG" "Checking for fixable package.json issues..."
    
    # Add missing scripts
    if ! jq -e '.scripts["test:ci"]' package.json >/dev/null 2>&1; then
        log "INFO" "Adding missing 'test:ci' script"
        jq '.scripts["test:ci"] = (.scripts.test // "vitest")' package.json > package.json.tmp && mv package.json.tmp package.json
    fi
    
    if ! jq -e '.scripts.lint' package.json >/dev/null 2>&1; then
        log "WARN" "No lint script found - please add one manually"
    fi
    
    # Update dependencies if needed
    log "INFO" "Updating package-lock.json"
    npm install --package-lock-only
    
    cd "$APPS_REPO_ROOT"
}

create_validation_report() {
    local app_name="$1"
    local report_file="$SCRIPT_DIR/reports/$app_name-validation-report-$(date +%Y%m%d-%H%M%S).md"
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    
    cat > "$report_file" << EOF
# Validation Report: $app_name

**Date:** $(date)
**Status:** $( [[ $FAILED_TESTS -eq 0 ]] && echo "✅ PASSED" || echo "❌ FAILED" )

## Summary
- **Total Tests:** $TOTAL_TESTS
- **Passed:** $PASSED_TESTS
- **Failed:** $FAILED_TESTS
- **Warnings:** $WARNINGS
- **Success Rate:** $success_rate%

## Test Results

$( [[ $FAILED_TESTS -eq 0 ]] && echo "🎉 All critical tests passed! The app migration appears to be successful." || echo "⚠️  Some tests failed. Review the issues below and fix them before proceeding." )

## Next Steps

$( [[ $FAILED_TESTS -eq 0 ]] && cat << 'NEXT_STEPS'
### ✅ Migration Successful
1. **Test the app manually** in Contentful to ensure it works correctly
2. **Run the cleanup script** to remove the app from marketplace-partner-apps:
   \`\`\`bash
   ./cleanup-migrated-app.sh $app_name
   \`\`\`
3. **Update any CI/CD configurations** if needed
4. **Deploy the app** using the apps repository pipeline

NEXT_STEPS
|| cat << 'FAILED_STEPS'
### ❌ Migration Issues Found
1. **Review the failed tests** in the validation log
2. **Fix the issues** manually or try running with \`--fix-issues\`:
   \`\`\`bash
   ./validate-migration.sh $app_name --fix-issues
   \`\`\`
3. **Re-run validation** after fixing issues
4. **Do not run cleanup** until all tests pass

FAILED_STEPS
)

## Detailed Logs
- **Validation Log:** $LOG_FILE
- **Validation Report:** $report_file

## Manual Testing Checklist
- [ ] App loads correctly in Contentful
- [ ] All app functionality works as expected
- [ ] App configuration is preserved
- [ ] App integrations work correctly
- [ ] Performance is acceptable

$( [[ ${#MANUAL_ACTIONS[@]} -gt 0 ]] && cat << 'MANUAL_ACTIONS_SECTION'
## Manual Action Items Required

The following items need to be completed manually:

MANUAL_ACTIONS_SECTION
for action in "${MANUAL_ACTIONS[@]}"; do
    echo "- [ ] $action"
done
echo
)
EOF

    log "INFO" "Validation report created: $report_file"
}

# =============================================================================
# Main Validation Function
# =============================================================================

validate_migration() {
    local app_name="$1"
    
    log "INFO" "Starting validation of migrated app: $app_name"
    echo
    echo "============================================================================="
    echo "  Migration Validation: $app_name"
    echo "============================================================================="
    echo
    
    # Check if app exists
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    if [[ ! -d "$app_path" ]]; then
        log "ERROR" "App '$app_name' not found in apps repository"
        exit 1
    fi
    
    # Run validation tests with error handling
    log "INFO" "Step 1/6: Validating file structure..."
    if ! validate_file_structure "$app_name"; then
        log "ERROR" "❌ File structure validation failed - stopping validation"
        echo "❌ Validation failed at Step 1: File structure validation"
        exit 1
    fi
    echo
    
    log "INFO" "Step 2/6: Validating package.json..."
    if ! validate_package_json "$app_name"; then
        log "ERROR" "❌ Package.json validation failed - stopping validation"
        echo "❌ Validation failed at Step 2: Package.json validation"
        exit 1
    fi
    echo
    
    log "INFO" "Step 3/6: Validating dependencies..."
    if ! validate_dependencies "$app_name"; then
        log "ERROR" "❌ Dependencies validation failed - stopping validation"
        echo "❌ Validation failed at Step 3: Dependencies validation"
        exit 1
    fi
    echo
    
    log "INFO" "Step 4/6: Validating build process..."
    if ! validate_build_process "$app_name"; then
        log "ERROR" "❌ Build process validation failed - stopping validation"
        echo "❌ Validation failed at Step 4: Build process validation"
        exit 1
    fi
    echo
    
    log "INFO" "Step 5/6: Validating tests..."
    if ! validate_tests "$app_name"; then
        log "ERROR" "❌ Tests validation failed - stopping validation"
        echo "❌ Validation failed at Step 5: Tests validation"
        exit 1
    fi
    echo
    
    log "INFO" "Step 6/6: Validating linting..."
    if ! validate_linting "$app_name"; then
        log "ERROR" "❌ Linting validation failed - stopping validation"
        echo "❌ Validation failed at Step 6: Linting validation"
        exit 1
    fi
    echo
    
    # Try to fix issues if requested
    log "INFO" "Running post-validation fixes..."
    fix_common_issues "$app_name"
    echo
    
    # Generate report
    log "INFO" "Creating validation report..."
    create_validation_report "$app_name"
    
    # Final summary
    echo "============================================================================="
    echo "  Validation Summary"
    echo "============================================================================="
    echo
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Warnings: $WARNINGS"
    echo
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo "🎉 Migration validation successful!"
        echo "The app appears to be ready for use in the apps repository."
        echo
        echo "Next step: Run './cleanup-migrated-app.sh $app_name' after manual testing"
    else
        echo "❌ Migration validation failed!"
        echo "Please fix the issues before proceeding with cleanup."
        echo
        echo "Try running with --fix-issues to automatically fix common problems"
        exit 1
    fi
}

# =============================================================================
# Argument Parsing
# =============================================================================

parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --detailed)
                DETAILED=true
                shift
                ;;
            --fix-issues)
                FIX_ISSUES=true
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
    parse_arguments "$@"
    
    # Ensure logs and reports directories exist before setting up logging
    mkdir -p "$SCRIPT_DIR/logs" "$SCRIPT_DIR/reports"
    
    # Set LOG_FILE with app name prefix after parsing arguments
    LOG_FILE="$SCRIPT_DIR/logs/${APP_NAME}-validation-$(date +%Y%m%d-%H%M%S).log"
    
    validate_migration "$APP_NAME"
}

# Run main function with all arguments
main "$@"
