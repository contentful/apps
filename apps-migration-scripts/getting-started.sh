#!/bin/bash

# =============================================================================
# Getting Started with Migration Scripts
# =============================================================================
# Interactive guide for first-time users of the migration scripts
# =============================================================================

set -euo pipefail

# Disable colors for better compatibility
RED=''
GREEN=''
YELLOW=''
BLUE=''
PURPLE=''
CYAN=''
NC=''

# Clear screen for better presentation
clear

echo -e "${BLUE}============================================================================="
echo -e "  🚀 Welcome to the Marketplace Partner Apps Migration System!"
echo -e "=============================================================================${NC}"
echo
echo -e "${GREEN}This interactive guide will help you get started with migrating apps from"
echo -e "marketplace-partner-apps to the apps repository.${NC}"
echo
echo -e "${YELLOW}Press Enter to continue...${NC}"
read -r

# Check prerequisites
echo -e "${CYAN}Step 1: Checking Prerequisites...${NC}"
echo

# Check if we're in the right directory
if [[ ! -f "migrate-app.sh" ]] || [[ ! -f "lerna.json" ]]; then
    echo -e "${RED}❌ Error: You must run this script from the apps repository root directory.${NC}"
    echo -e "${YELLOW}   Make sure you're in the directory that contains migrate-app.sh${NC}"
    exit 1
fi

    # Check for marketplace-partner-apps
    if [[ ! -d "../../marketplace-partner-apps" ]]; then
    echo -e "${RED}❌ Error: marketplace-partner-apps repository not found.${NC}"
    echo
    echo -e "${YELLOW}Expected structure:${NC}"
    echo -e "   your-folder/"
    echo -e "   ├── apps/                     ${GREEN}<-- You are here${NC}"
    echo -e "   └── marketplace-partner-apps/ ${RED}<-- Missing!${NC}"
    echo
    echo -e "${YELLOW}Please clone marketplace-partner-apps alongside the apps repository.${NC}"
    exit 1
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 16 or higher.${NC}"
    exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//')
MAJOR_VERSION=$(echo "$NODE_VERSION" | cut -d. -f1)
if [[ "$MAJOR_VERSION" -lt 16 ]]; then
    echo -e "${RED}❌ Node.js version $NODE_VERSION found. Version 16 or higher required.${NC}"
    exit 1
fi

# Check other tools
for tool in npm git jq; do
    if ! command -v "$tool" &> /dev/null; then
        echo -e "${RED}❌ $tool not found. Please install $tool.${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ All prerequisites met!${NC}"
echo -e "   • Node.js: $NODE_VERSION"
echo -e "   • Apps repository: Found"
echo -e "   • Marketplace-partner-apps: Found"
echo -e "   • Required tools: npm, git, jq"
echo

echo -e "${YELLOW}Press Enter to continue...${NC}"
read -r

# Show available apps
echo -e "${CYAN}Step 2: Available Apps to Migrate${NC}"
echo
echo -e "${GREEN}Here are the apps available in marketplace-partner-apps:${NC}"
echo

# List apps with numbers
mapfile -t APPS < <(ls ../../marketplace-partner-apps/apps/ 2>/dev/null | head -20)

if [[ ${#APPS[@]} -eq 0 ]]; then
    echo -e "${RED}❌ No apps found in marketplace-partner-apps/apps/${NC}"
    exit 1
fi

for i in "${!APPS[@]}"; do
    printf "%2d. %s\n" $((i+1)) "${APPS[i]}"
done

TOTAL_APPS=$(ls -1 ../../marketplace-partner-apps/apps/ | wc -l)
if [[ $TOTAL_APPS -gt 20 ]]; then
    echo "    ... and $((TOTAL_APPS - 20)) more"
fi

echo
echo -e "${YELLOW}Press Enter to continue...${NC}"
read -r

# Explain the workflow
echo -e "${CYAN}Step 3: Migration Workflow Overview${NC}"
echo
echo -e "${GREEN}The migration process has 4 main steps:${NC}"
echo
echo -e "${PURPLE}1. 🔍 DRY-RUN${NC} - Preview what will happen (safe)"
echo -e "   ./migrate-app.sh <app-name> --dry-run"
echo
echo -e "${PURPLE}2. 📦 MIGRATE${NC} - Actually transfer the app"
echo -e "   ./migrate-app.sh <app-name>"
echo
echo -e "${PURPLE}3. ✅ VALIDATE${NC} - Test that everything works"
echo -e "   ./validate-migration.sh <app-name>"
echo
echo -e "${PURPLE}4. 🗑️  CLEANUP${NC} - Remove from marketplace-partner-apps (DESTRUCTIVE!)"
echo -e "   ./cleanup-migrated-app.sh <app-name>"
echo
echo -e "${YELLOW}Between steps 3 and 4, you should manually test the app thoroughly!${NC}"
echo

echo -e "${YELLOW}Press Enter to continue...${NC}"
read -r

# Interactive app selection
echo -e "${CYAN}Step 4: Choose an App to Migrate${NC}"
echo
echo -e "${GREEN}Let's practice with a real app migration!${NC}"
echo
echo -e "Enter the name of an app to migrate (or 'skip' to just see documentation):"
echo -e "${YELLOW}App name: ${NC}"
read -r APP_NAME

if [[ "$APP_NAME" == "skip" ]] || [[ -z "$APP_NAME" ]]; then
    echo
    echo -e "${GREEN}No problem! Here's where to find more information:${NC}"
    echo
    echo -e "${YELLOW}📖 Read the detailed usage guide:${NC}"
    echo -e "   cat USAGE_GUIDE.md"
    echo
    echo -e "${YELLOW}📖 Read the technical documentation:${NC}"
    echo -e "   cat MIGRATION_README.md"
    echo
    echo -e "${YELLOW}🔍 Get a quick summary anytime:${NC}"
    echo -e "   ./migration-summary.sh"
    echo
    echo -e "${YELLOW}💡 Get help with any script:${NC}"
    echo -e "   ./migrate-app.sh --help"
    echo -e "   ./validate-migration.sh --help"
    echo -e "   ./cleanup-migrated-app.sh --help"
    echo
    echo -e "${GREEN}Happy migrating! 🚀${NC}"
    exit 0
fi

# Validate app name
if [[ ! -d "../../marketplace-partner-apps/apps/$APP_NAME" ]]; then
    echo -e "${RED}❌ App '$APP_NAME' not found in marketplace-partner-apps/apps/${NC}"
    echo
    echo -e "${YELLOW}Available apps:${NC}"
    ls -1 ../../marketplace-partner-apps/apps/ | head -10
    echo
    echo -e "${YELLOW}You can run this script again or use the exact app name.${NC}"
    exit 1
fi

# Check if app already exists
if [[ -d "../apps/$APP_NAME" ]]; then
    echo -e "${RED}❌ App '$APP_NAME' already exists in apps repository.${NC}"
    echo -e "${YELLOW}   Please choose a different app or remove the existing one.${NC}"
    exit 1
fi

# Guided migration
echo
echo -e "${GREEN}✅ App '$APP_NAME' found and ready to migrate!${NC}"
echo

echo -e "${CYAN}Step 5: Guided Migration${NC}"
echo
echo -e "${PURPLE}Let's start with a dry-run to see what will happen:${NC}"
echo
echo -e "${YELLOW}Running: ./migrate-app.sh $APP_NAME --dry-run${NC}"
echo
echo -e "Press Enter to run the dry-run..."
read -r

# Run dry-run
if ./migrate-app.sh "$APP_NAME" --dry-run; then
    echo
    echo -e "${GREEN}✅ Dry-run completed successfully!${NC}"
    echo
    echo -e "${YELLOW}Review the output above. Does everything look correct?${NC}"
    echo -e "Enter 'yes' to proceed with the actual migration, or anything else to stop:"
    read -r PROCEED
    
    if [[ "$PROCEED" != "yes" ]]; then
        echo
        echo -e "${YELLOW}Migration stopped. You can run the scripts manually when ready:${NC}"
        echo -e "   ./migrate-app.sh $APP_NAME"
        echo
        echo -e "${YELLOW}Or read the documentation:${NC}"
        echo -e "   cat USAGE_GUIDE.md"
        exit 0
    fi
    
    # Actual migration
    echo
    echo -e "${PURPLE}Running the actual migration...${NC}"
    echo
    echo -e "${YELLOW}Running: ./migrate-app.sh $APP_NAME${NC}"
    echo
    
    if ./migrate-app.sh "$APP_NAME"; then
        echo
        echo -e "${GREEN}🎉 Migration completed successfully!${NC}"
        echo
        echo -e "${PURPLE}Next step: Validation${NC}"
        echo
        echo -e "${YELLOW}Running: ./validate-migration.sh $APP_NAME${NC}"
        echo -e "Press Enter to run validation..."
        read -r
        
        if ./validate-migration.sh "$APP_NAME"; then
            echo
            echo -e "${GREEN}🎉 Validation passed!${NC}"
            echo
            echo -e "${CYAN}Final Steps:${NC}"
            echo
            echo -e "${YELLOW}1. Test the app manually:${NC}"
            echo -e "   cd apps/$APP_NAME"
            echo -e "   npm start"
            echo
            echo -e "${YELLOW}2. Test in Contentful thoroughly${NC}"
            echo
            echo -e "${YELLOW}3. Only after thorough testing, run cleanup:${NC}"
            echo -e "   ./cleanup-migrated-app.sh $APP_NAME"
            echo
            echo -e "${RED}⚠️  IMPORTANT: Only run cleanup after you're 100% sure everything works!${NC}"
            echo
        else
            echo
            echo -e "${RED}❌ Validation failed. Check the validation report for details.${NC}"
            echo -e "${YELLOW}Try running: ./validate-migration.sh $APP_NAME --fix-issues${NC}"
        fi
    else
        echo
        echo -e "${RED}❌ Migration failed. Check the logs for details.${NC}"
    fi
else
    echo
    echo -e "${RED}❌ Dry-run failed. Please fix the issues before proceeding.${NC}"
fi

echo
echo -e "${GREEN}✨ Thanks for using the migration scripts!${NC}"
echo
echo -e "${YELLOW}For more help:${NC}"
echo -e "• Read USAGE_GUIDE.md for detailed instructions"
echo -e "• Run ./migration-summary.sh for a quick reference"
echo -e "• Use --help flag with any script for specific help"
echo
