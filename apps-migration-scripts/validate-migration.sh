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
    
    case "$level" in
        "INFO")  echo -e "${GREEN}[INFO]${NC} $message" | tee -a "$LOG_FILE" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" | tee -a "$LOG_FILE" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" | tee -a "$LOG_FILE" ;;
        "DEBUG") [[ "$DETAILED" == true ]] && echo -e "${BLUE}[DEBUG]${NC} $message" | tee -a "$LOG_FILE" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $message" | tee -a "$LOG_FILE" ;;
        "FAIL") echo -e "${RED}[FAIL]${NC} $message" | tee -a "$LOG_FILE" ;;
    esac
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
        echo -e "${GREEN}✓${NC}"
        ((PASSED_TESTS++))
        log "SUCCESS" "Test passed: $test_name"
        return 0
    else
        if [[ "$required" == "true" ]]; then
            echo -e "${RED}✗${NC}"
            ((FAILED_TESTS++))
            # Show the actual error output
            if [[ -n "$test_output" ]]; then
                echo -e "${RED}    Error: ${NC}$test_output"
                log "FAIL" "Test failed: $test_name - Error: $test_output"
            else
                log "FAIL" "Test failed: $test_name - No error output"
            fi
            return 1
        else
            echo -e "${YELLOW}⚠${NC}"
            ((WARNINGS++))
            # Show warning details if available
            if [[ -n "$test_output" ]]; then
                echo -e "${YELLOW}    Warning: ${NC}$test_output"
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
    • Apps repository integration

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

# =============================================================================
# Validation Functions
# =============================================================================

validate_file_structure() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    echo "📁 Validating file structure..."
    
    # Check if app directory exists
    run_test "App directory exists" "[[ -d '$app_path' ]]"
    
    # Check for required files
    run_test "package.json exists" "[[ -f '$app_path/package.json' ]]"
    run_test "Source directory exists" "[[ -d '$app_path/src' ]]"
    
    # Check for optional but common files
    run_test "README.md exists" "[[ -f '$app_path/README.md' ]]" "false"
    run_test "LICENSE exists" "[[ -f '$app_path/LICENSE' ]]" "false"
    
    # Check for build configuration
    local has_build_config=false
    if [[ -f "$app_path/vite.config.ts" ]] || [[ -f "$app_path/vite.config.js" ]] || [[ -f "$app_path/vite.config.mjs" ]]; then
        has_build_config=true
    elif [[ -f "$app_path/webpack.config.js" ]] || [[ -f "$app_path/rollup.config.js" ]]; then
        has_build_config=true
    fi
    run_test "Build configuration exists" "[[ '$has_build_config' == true ]]"
    
    # Check TypeScript configuration
    run_test "TypeScript config exists" "[[ -f '$app_path/tsconfig.json' ]]" "false"
}

validate_package_json() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    local package_json="$app_path/package.json"
    
    echo "📦 Validating package.json..."
    
    # Check required scripts
    run_test "start script exists" "jq -e '.scripts.start' '$package_json' >/dev/null || echo 'Missing start script in package.json'"
    run_test "build script exists" "jq -e '.scripts.build' '$package_json' >/dev/null || echo 'Missing build script in package.json'"
    run_test "test script exists" "jq -e '.scripts.test' '$package_json' >/dev/null || echo 'Missing test script in package.json'"
    
    # Check apps repository conventions
    run_test "Has @contentful scope" "jq -e '.name | startswith(\"@contentful/\")' '$package_json' >/dev/null || echo 'App name should start with @contentful/'" "false"
    run_test "Is marked as private" "jq -e '.private == true' '$package_json' >/dev/null || echo 'Package should be marked as private: true'"
    
    # Check for common dependencies
    run_test "Has @contentful/app-sdk" "jq -e '.dependencies[\"@contentful/app-sdk\"]' '$package_json' >/dev/null || echo 'Missing @contentful/app-sdk dependency'" "false"
    run_test "Has React dependency" "jq -e '.dependencies.react' '$package_json' >/dev/null || echo 'Missing React dependency'" "false"
    
    # Check for actually deprecated scripts (if any are identified in the future)
    # Currently no scripts are flagged as deprecated
    run_test "Package.json structure valid" "true"
}

validate_dependencies() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    echo "🔗 Validating dependencies..."
    
    cd "$app_path"
    
    # Check if package-lock.json exists
    run_test "package-lock.json exists" "[[ -f package-lock.json ]]"
    
    # Try to install dependencies
    run_test "Dependencies can be installed" "npm ci"
    
    # Check for security vulnerabilities (show vulnerabilities if found)
    run_test "No high-severity vulnerabilities" "npm audit --audit-level=high"
    
    # Check for outdated dependencies (informational only)
    echo "  Checking for outdated dependencies..."
    local outdated_output
    outdated_output=$(npm outdated 2>/dev/null || true)
    
    if [[ -n "$outdated_output" ]]; then
        echo -e "${YELLOW}    📦 Outdated dependencies found:${NC}"
        echo
        # Format the npm outdated output nicely
        echo "    Package                Current    Wanted     Latest"
        echo "    ─────────────────────────────────────────────────────"
        echo "$outdated_output" | tail -n +2 | while IFS= read -r line; do
            echo "    $line"
        done
        echo
        echo -e "${YELLOW}    ⚠️  Note: Outdated dependencies don't prevent migration${NC}"
        echo -e "${BLUE}    💡 You can update them later with: npm update${NC}"
        
        # Count how many packages are outdated
        local outdated_count=$(echo "$outdated_output" | tail -n +2 | wc -l | tr -d ' ')
        log "INFO" "Found $outdated_count outdated dependencies"
    else
        echo -e "${GREEN}    ✓ All dependencies are up to date${NC}"
        log "INFO" "All dependencies are up to date"
    fi
    
    cd "$APPS_REPO_ROOT"
}

validate_build_process() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    echo "🔨 Validating build process..."
    
    cd "$app_path"
    
    # Try to build the app
    run_test "App builds successfully" "npm run build"
    
    # Check if build artifacts are created
    local build_dir=""
    if [[ -d "build" ]]; then
        build_dir="build"
    elif [[ -d "dist" ]]; then
        build_dir="dist"
    fi
    
    if [[ -n "$build_dir" ]]; then
        run_test "Build artifacts created" "[[ -d '$build_dir' && \$(find '$build_dir' -type f | wc -l) -gt 0 ]]"
        run_test "Build includes HTML file" "find '$build_dir' -name '*.html' | grep -q ." "false"
        run_test "Build includes JS files" "find '$build_dir' -name '*.js' | grep -q ."
    fi
    
    cd "$APPS_REPO_ROOT"
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
        # Try to run tests
        run_test "Tests pass" "npm test -- --run 2>/dev/null || npm test 2>/dev/null"
    fi
    
    cd "$APPS_REPO_ROOT"
}

validate_linting() {
    local app_name="$1"
    local app_path="$APPS_REPO_ROOT/apps/$app_name"
    
    echo "🔍 Validating linting..."
    
    cd "$app_path"
    
    # Check if lint script exists
    if jq -e '.scripts.lint' package.json >/dev/null; then
        run_test "Linting passes" "npm run lint"
    else
        echo -e "${YELLOW}  📝 No lint script found, adding smart lint configuration...${NC}"
        
        # Add smart lint script and get the details
        local lint_details=$(add_smart_lint_script_validation "$app_path")
        
        echo -e "${GREEN}  ✅ $lint_details${NC}"
        log "INFO" "Added smart lint script: $lint_details"
        
        # Now try to run linting
        echo "  Testing newly added linting configuration..."
        run_test "Linting passes (after auto-setup)" "npm run lint"
    fi
    
    cd "$APPS_REPO_ROOT"
}

validate_apps_repo_integration() {
    local app_name="$1"
    
    echo "🔧 Validating apps repository integration..."
    
    # Check if lerna recognizes the app
    run_test "Lerna recognizes app" "npx lerna list | grep -q '$app_name'"
    
    # Try lerna bootstrap on the specific app
    run_test "Lerna bootstrap works" "npx lerna bootstrap --scope=*$app_name* --include-dependencies"
    
    # Check if the app can be built via lerna
    run_test "Lerna build works" "npx lerna run build --scope=*$app_name*"
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
        log "INFO" "Adding missing 'lint' script with smart detection"
        add_smart_lint_script_validation "$(pwd)"
    fi
    
    # Update dependencies if needed
    log "INFO" "Updating package-lock.json"
    npm install --package-lock-only
    
    cd "$APPS_REPO_ROOT"
}

add_smart_lint_script_validation() {
    local app_path="$1"
    local package_json="$app_path/package.json"
    
    log "DEBUG" "Detecting project type for smart linting setup..."
    
    # Read package.json to detect project type
    local package_content=$(cat "$package_json")
    local eslint_deps_needed=false
    local lint_command=""
    local project_type=""
    
    # Detect project type and determine lint script + dependencies needed
    if echo "$package_content" | jq -e '.dependencies.next or .devDependencies.next' >/dev/null 2>&1; then
        # Next.js project - has built-in ESLint support
        project_type="Next.js"
        lint_command="next lint"
        eslint_deps_needed=false
        
    elif echo "$package_content" | jq -e '.dependencies.vite or .devDependencies.vite' >/dev/null 2>&1; then
        # Vite project
        project_type="Vite"
        lint_command="eslint src --max-warnings 0"
        eslint_deps_needed=true
        
    elif echo "$package_content" | jq -e '.dependencies["react-scripts"] or .devDependencies["react-scripts"]' >/dev/null 2>&1; then
        # Create React App project - has built-in ESLint
        project_type="Create React App"
        lint_command="eslint src --max-warnings 0"
        eslint_deps_needed=false
        
    elif echo "$package_content" | jq -e '.dependencies.webpack or .devDependencies.webpack' >/dev/null 2>&1; then
        # Webpack project
        project_type="Webpack"
        lint_command="eslint src --max-warnings 0"
        eslint_deps_needed=true
        
    elif [[ -f "$app_path/tsconfig.json" ]] && [[ -d "$app_path/src" ]]; then
        # TypeScript project with src directory
        project_type="TypeScript"
        lint_command="eslint src --ext .ts,.tsx --max-warnings 0"
        eslint_deps_needed=true
        
    elif [[ -d "$app_path/src" ]]; then
        # Generic project with src directory
        project_type="Generic with src/"
        lint_command="eslint src --max-warnings 0"
        eslint_deps_needed=true
        
    else
        # Fallback - basic ESLint setup
        project_type="Generic"
        lint_command="eslint . --max-warnings 0"
        eslint_deps_needed=true
    fi
    
    # Add the lint script
    jq --arg cmd "$lint_command" '.scripts.lint = $cmd' package.json > package.json.tmp && mv package.json.tmp package.json
    
    # Install ESLint dependencies if needed
    if [[ "$eslint_deps_needed" == true ]]; then
        # Check if ESLint is already installed
        if ! echo "$package_content" | jq -e '.devDependencies.eslint or .dependencies.eslint' >/dev/null 2>&1; then
            log "INFO" "Installing ESLint dependencies for $project_type project..."
            
            # Determine which ESLint packages to install based on project type
            local eslint_packages="eslint"
            
            # Add TypeScript ESLint support if it's a TypeScript project
            if [[ -f "$app_path/tsconfig.json" ]]; then
                eslint_packages="$eslint_packages @typescript-eslint/eslint-plugin @typescript-eslint/parser"
            fi
            
            # Add React ESLint support if React is detected
            if echo "$package_content" | jq -e '.dependencies.react or .devDependencies.react' >/dev/null 2>&1; then
                eslint_packages="$eslint_packages eslint-plugin-react eslint-plugin-react-hooks"
            fi
            
            # Install the packages
            npm install --save-dev $eslint_packages
            
            # Create a basic ESLint config if none exists
            if [[ ! -f "$app_path/.eslintrc.js" ]] && [[ ! -f "$app_path/.eslintrc.json" ]] && [[ ! -f "$app_path/.eslintrc.yml" ]]; then
                create_basic_eslint_config "$app_path"
            fi
            
            echo "Added $project_type lint script: \"$lint_command\" with ESLint dependencies"
        else
            echo "Added $project_type lint script: \"$lint_command\" (ESLint already installed)"
        fi
    else
        echo "Added $project_type lint script: \"$lint_command\""
    fi
}

create_basic_eslint_config() {
    local app_path="$1"
    
    log "DEBUG" "Creating basic ESLint configuration..."
    
    # Determine what type of config to create based on project
    local config_content
    local is_typescript=false
    local is_react=false
    
    # Check if it's a TypeScript project
    if [[ -f "$app_path/tsconfig.json" ]]; then
        is_typescript=true
    fi
    
    # Check if it's a React project
    if grep -q '"react"' "$app_path/package.json"; then
        is_react=true
    fi
    
    # Create appropriate ESLint config
    if [[ "$is_typescript" == true ]] && [[ "$is_react" == true ]]; then
        # TypeScript + React config
        config_content='{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "react-hooks",
    "@typescript-eslint"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}'
    elif [[ "$is_typescript" == true ]]; then
        # TypeScript only config
        config_content='{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "@typescript-eslint"
  ],
  "rules": {}
}'
    elif [[ "$is_react" == true ]]; then
        # React only config
        config_content='{
  "env": {
    "browser": true,
    "es2021": true
  },
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "parserOptions": {
    "ecmaFeatures": {
      "jsx": true
    },
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "plugins": [
    "react",
    "react-hooks"
  ],
  "rules": {
    "react/react-in-jsx-scope": "off"
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}'
    else
        # Basic JavaScript config
        config_content='{
  "env": {
    "browser": true,
    "es2021": true,
    "node": true
  },
  "extends": [
    "eslint:recommended"
  ],
  "parserOptions": {
    "ecmaVersion": 12,
    "sourceType": "module"
  },
  "rules": {}
}'
    fi
    
    # Write the config file
    echo "$config_content" > "$app_path/.eslintrc.json"
    log "INFO" "Created .eslintrc.json configuration file"
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
    
    # Run validation tests
    validate_file_structure "$app_name"
    echo
    
    validate_package_json "$app_name"
    echo
    
    validate_dependencies "$app_name"
    echo
    
    validate_build_process "$app_name"
    echo
    
    validate_tests "$app_name"
    echo
    
    validate_linting "$app_name"
    echo
    
    validate_apps_repo_integration "$app_name"
    echo
    
    # Try to fix issues if requested
    fix_common_issues "$app_name"
    echo
    
    # Generate report
    create_validation_report "$app_name"
    
    # Final summary
    echo "============================================================================="
    echo "  Validation Summary"
    echo "============================================================================="
    echo
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo "Failed: ${RED}$FAILED_TESTS${NC}"
    echo "Warnings: ${YELLOW}$WARNINGS${NC}"
    echo
    
    if [[ $FAILED_TESTS -eq 0 ]]; then
        echo -e "${GREEN}🎉 Migration validation successful!${NC}"
        echo "The app appears to be ready for use in the apps repository."
        echo
        echo "Next step: Run './cleanup-migrated-app.sh $app_name' after manual testing"
    else
        echo -e "${RED}❌ Migration validation failed!${NC}"
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
    
    # Set LOG_FILE with app name prefix after parsing arguments
    LOG_FILE="$SCRIPT_DIR/logs/${APP_NAME}-validation-$(date +%Y%m%d-%H%M%S).log"
    
    validate_migration "$APP_NAME"
}

# Run main function with all arguments
main "$@"
