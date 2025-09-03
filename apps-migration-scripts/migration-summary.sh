#!/bin/bash

# =============================================================================
# Migration Scripts Summary
# =============================================================================
# Quick reference guide for the marketplace-partner-apps migration scripts
# =============================================================================

# Disable colors for better compatibility
GREEN=''
YELLOW=''
BLUE=''
PURPLE=''
NC=''

show_summary() {
    cat << EOF
${BLUE}=============================================================================
  Marketplace Partner Apps Migration Scripts - Quick Reference
=============================================================================${NC}

${GREEN}📋 Available Scripts:${NC}
  
${YELLOW}1. migrate-app.sh${NC}         - Transfer app from marketplace-partner-apps to apps repo
${YELLOW}2. validate-migration.sh${NC}  - Validate successful migration
${YELLOW}3. cleanup-migrated-app.sh${NC} - Remove app from marketplace-partner-apps (DESTRUCTIVE!)

${GREEN}🚀 Quick Start (First Time Users):${NC}

  ${PURPLE}Read the step-by-step guide:${NC} ${YELLOW}cat USAGE_GUIDE.md${NC}
  
  ${PURPLE}Start with a dry-run:${NC}
  ./migrate-app.sh <app-name> --dry-run
  
  ${PURPLE}Then follow the complete workflow:${NC}
  1. ./migrate-app.sh <app-name>
  2. ./validate-migration.sh <app-name>
  3. Test manually in Contentful
  4. ./cleanup-migrated-app.sh <app-name>

${GREEN}📖 Documentation:${NC}
  
  ${YELLOW}USAGE_GUIDE.md${NC}        - Step-by-step instructions (START HERE!)
  ${YELLOW}MIGRATION_README.md${NC}   - Technical documentation
  ${YELLOW}<script> --help${NC}       - Individual script help

${GREEN}💡 Pro Tips:${NC}
  
  • Always use ${YELLOW}--dry-run${NC} first to preview changes
  • Use ${YELLOW}--verbose${NC} or ${YELLOW}--detailed${NC} for debugging
  • Check generated reports and logs for details
  • Only run cleanup after thorough testing!

${GREEN}🔍 Available Apps in marketplace-partner-apps:${NC}

EOF

    if [[ -d "../marketplace-partner-apps/apps" ]]; then
        # Get all apps and display them in columns
        local apps=($(ls -1 "../marketplace-partner-apps/apps/" 2>/dev/null))
        local total_apps=${#apps[@]}
        
        if [[ $total_apps -eq 0 ]]; then
            echo "  ${YELLOW}No apps found in marketplace-partner-apps/apps/${NC}"
        else
            # Display apps in 3 columns
            local cols=3
            local rows=$(( (total_apps + cols - 1) / cols ))
            
            for ((row=0; row<rows; row++)); do
                printf "  "
                for ((col=0; col<cols; col++)); do
                    local index=$((col * rows + row))
                    if [[ $index -lt $total_apps ]]; then
                        printf "%-30s" "• ${apps[$index]}"
                    fi
                done
                echo
            done
            
            echo
            echo "  ${GREEN}Total: $total_apps apps available${NC}"
        fi
    else
        echo "  ${YELLOW}marketplace-partner-apps not found at ../marketplace-partner-apps${NC}"
    fi

    cat << EOF

${GREEN}📁 Migration Status:${NC}

EOF

    # Check for any existing migration reports
    local reports=($(find . -maxdepth 1 -name "*-report-*.md" 2>/dev/null))
    if [[ ${#reports[@]} -gt 0 ]]; then
        echo "  Recent migration activities found:"
        for report in "${reports[@]:0:5}"; do
            echo "  • $(basename "$report")"
        done
        if [[ ${#reports[@]} -gt 5 ]]; then
            echo "  ... and $((${#reports[@]} - 5)) more reports"
        fi
    else
        echo "  No recent migration activities found"
    fi

    cat << EOF

${BLUE}=============================================================================${NC}

For detailed documentation: ${YELLOW}cat USAGE_GUIDE.md${NC}
For script help: ${YELLOW}<script-name> --help${NC}

${PURPLE}⚠️  Remember: Always test thoroughly before running cleanup!${NC}

EOF
}

# Show summary by default, but also support --help
case "${1:-}" in
    --help|-h)
        show_summary
        ;;
    *)
        show_summary
        ;;
esac
