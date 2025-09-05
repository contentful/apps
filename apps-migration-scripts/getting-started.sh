#!/bin/bash

# =============================================================================
# Getting Started with Migration Scripts
# =============================================================================
# Interactive guide for first-time users of the migration scripts
# =============================================================================

set -euo pipefail

# Clear screen for better presentation
clear

echo "============================================================================="
echo "  🚀 Welcome to the Marketplace Partner Apps Migration System!"
echo "============================================================================="
echo
echo "This interactive guide will help you get started with migrating apps from"
echo "marketplace-partner-apps to the apps repository."
echo
echo "Press Enter to continue..."
read -r

# Check prerequisites
echo "Step 1: Checking Prerequisites..."
echo

# Check if we're in the right directory (apps-migration-scripts)
if [[ ! -f "migrate-app.sh" ]] || [[ ! -f "../lerna.json" ]]; then
    echo "❌ Error: You must run this script from the apps-migration-scripts directory."
    echo "   Make sure you're in: apps/apps-migration-scripts/"
    echo "   Expected files: ./migrate-app.sh and ../lerna.json"
    exit 1
fi

    # Check for marketplace-partner-apps
    if [[ ! -d "../../marketplace-partner-apps" ]]; then
    echo "❌ Error: marketplace-partner-apps repository not found."
    echo
    echo "Expected structure:"
    echo "   your-folder/"
    echo "   ├── apps/                     <-- You are here"
    echo "   └── marketplace-partner-apps/ <-- Missing!"
    echo
    echo "Please clone marketplace-partner-apps alongside the apps repository."
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 16 or higher."
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)
if [[ "$MAJOR_VERSION" -lt 16 ]]; then
    echo "❌ Node.js version $NODE_VERSION found. Version 16 or higher required."
    exit 1
fi

# Check other tools
for tool in npm git jq; do
    if ! command -v "$tool" &> /dev/null; then
        echo "❌ $tool not found. Please install $tool."
        exit 1
    fi
done

echo "✅ All prerequisites met!"
echo "   • Node.js: $NODE_VERSION"
echo "   • Apps repository: Found"
echo "   • Marketplace-partner-apps: Found"
echo "   • Required tools: npm, git, jq"
echo

echo "Press Enter to continue..."
read -r

# Show available apps
echo "Step 2: Available Apps to Migrate"
echo
echo "Here are the apps available in marketplace-partner-apps:"
echo

# List all apps with numbers (compatible approach)
APPS_LIST=$(ls ../../marketplace-partner-apps/apps/ 2>/dev/null)

if [[ -z "$APPS_LIST" ]]; then
    echo "❌ No apps found in marketplace-partner-apps/apps/"
    exit 1
fi

# Convert to array using compatible method
APPS=()
while IFS= read -r line; do
    [[ -n "$line" ]] && APPS+=("$line")
done <<< "$APPS_LIST"

# Display numbered list in columns for better readability
counter=1
for app in "${APPS[@]}"; do
    printf "%2d. %s\n" "$counter" "$app"
    ((counter++))
done

echo
echo "Total: ${#APPS[@]} apps available"

echo
echo "Press Enter to continue..."
read -r

# Explain the workflow
echo "Step 3: Migration Workflow Overview"
echo
echo "The migration process has 4 main steps:"
echo
echo "1. 🔍 DRY-RUN - Preview what will happen (safe)"
echo "   ./migrate-app.sh <app-name> --dry-run"
echo
echo "2. 📦 MIGRATE - Actually transfer the app"
echo "   ./migrate-app.sh <app-name>"
echo
echo "3. ✅ VALIDATE - Test that everything works"
echo "   ./validate-migration.sh <app-name>"
echo
echo "4. 🗑️  CLEANUP - Remove from marketplace-partner-apps (DESTRUCTIVE!)"
echo "   ./cleanup-migrated-app.sh <app-name>"
echo
echo "Between steps 3 and 4, you should manually test the app thoroughly!"
echo

echo "Press Enter to continue..."
read -r

# Interactive app selection
echo "Step 4: Choose an App to Migrate"
echo
echo "Let's practice with a real app migration!"
echo
echo "Select an app by entering its number (or 's' to skip to documentation):"
echo

# Show the numbered list again for easy reference
counter=1
for app in "${APPS[@]}"; do
    printf "%2d. %s\n" "$counter" "$app"
    ((counter++))
done

echo
echo "Enter choice (1-${#APPS[@]}, or 's' to skip): "
read -r CHOICE

# Handle skip option
if [[ "$CHOICE" == "s" ]] || [[ "$CHOICE" == "skip" ]] || [[ -z "$CHOICE" ]]; then
    echo
    echo "No problem! Here's where to find more information:"
    echo
    echo "📖 Read the detailed usage guide:"
    echo "   cat USAGE_GUIDE.md"
    echo
    echo "📖 Read the technical documentation:"
    echo "   cat TECHNICAL_REFERENCE.md"
    echo
    echo "🔍 Get a quick summary anytime:"
    echo "   ./migration-summary.sh"
    echo
    echo "💡 Get help with any script:"
    echo "   ./migrate-app.sh --help"
    echo "   ./validate-migration.sh --help"
    echo "   ./cleanup-migrated-app.sh --help"
    echo
    echo "Happy migrating! 🚀"
    exit 0
fi

# Validate and convert number choice to app name
if [[ "$CHOICE" =~ ^[0-9]+$ ]] && [[ "$CHOICE" -ge 1 ]] && [[ "$CHOICE" -le "${#APPS[@]}" ]]; then
    # Convert to array index (subtract 1 since arrays are 0-based)
    APP_INDEX=$((CHOICE - 1))
    APP_NAME="${APPS[$APP_INDEX]}"
    
    echo
    echo "✅ Selected: $APP_NAME"
    echo
else
    echo
    echo "❌ Error: Invalid selection '$CHOICE'"
    echo "Please enter a number between 1 and ${#APPS[@]}, or 's' to skip"
    echo
    echo "Tip: Run this script again to try another selection"
    exit 1
fi

# Check if app already exists
if [[ -d "../apps/$APP_NAME" ]]; then
    echo "❌ App '$APP_NAME' already exists in apps repository."
    echo "   Please choose a different app or remove the existing one."
    exit 1
fi

# Guided migration
echo
echo "✅ App '$APP_NAME' found and ready to migrate!"
echo

echo "Step 5: Guided Migration"
echo
echo "Let's start with a dry-run to see what will happen:"
echo
echo "Running: ./migrate-app.sh $APP_NAME --dry-run"
echo
echo "Press Enter to run the dry-run..."
read -r

# Run dry-run
if ./migrate-app.sh "$APP_NAME" --dry-run; then
    echo
    echo "✅ Dry-run completed successfully!"
    echo
    echo "Review the output above. Does everything look correct?"
    echo "Enter 'yes' to proceed with the actual migration, or anything else to stop:"
    read -r PROCEED
    
    if [[ "$PROCEED" != "yes" ]]; then
        echo
        echo "Migration stopped. You can run the scripts manually when ready:"
        echo "   ./migrate-app.sh $APP_NAME"
        echo
        echo "Or read the documentation:"
        echo "   cat USAGE_GUIDE.md"
        exit 0
    fi
    
    # Actual migration
    echo
    echo "Running the actual migration..."
    echo
    echo "Running: ./migrate-app.sh $APP_NAME"
    echo
    
    if ./migrate-app.sh "$APP_NAME"; then
        echo
        echo "🎉 Migration completed successfully!"
        echo
        echo "Next step: Validation"
        echo
        echo "Running: ./validate-migration.sh $APP_NAME"
        echo "Press Enter to run validation..."
        read -r
        
        if ./validate-migration.sh "$APP_NAME"; then
            echo
            echo "🎉 Validation passed!"
            echo
            echo "Final Steps:"
            echo
            echo "1. Test the app manually:"
            echo "   cd apps/$APP_NAME"
            echo "   npm start"
            echo
            echo "2. Test in Contentful thoroughly"
            echo
            echo "3. Only after thorough testing, run cleanup:"
            echo "   ./cleanup-migrated-app.sh $APP_NAME"
            echo
            echo "⚠️  IMPORTANT: Only run cleanup after you're 100% sure everything works!"
            echo
        else
            echo
            echo "❌ Validation failed. Check the validation report for details."
            echo "Try running: ./validate-migration.sh $APP_NAME --fix-issues"
        fi
    else
        echo
        echo "❌ Migration failed. Check the logs for details."
    fi
else
    echo
    echo "❌ Dry-run failed. Please fix the issues before proceeding."
fi

echo
echo "✨ Thanks for using the migration scripts!"
echo
echo "For more help:"
echo "• Read USAGE_GUIDE.md for detailed instructions"
echo "• Run ./migration-summary.sh for a quick reference"
echo "• Use --help flag with any script for specific help"
echo
