#!/bin/bash

# =============================================================================
# Migration Scripts Summary
# =============================================================================
# Quick reference guide for the marketplace-partner-apps migration scripts
# =============================================================================

show_summary() {
    cat << EOF
=============================================================================
  Marketplace Partner Apps Migration Scripts - Quick Reference
=============================================================================
📋 Available Scripts:  
1. migrate-app.sh         - Transfer app from marketplace-partner-apps to apps repo
2. validate-migration.sh  - Validate successful migration
3. cleanup-migrated-app.sh - Remove app from marketplace-partner-apps (DESTRUCTIVE!)

🚀 Quick Start (First Time Users):
Read the step-by-step guide: cat USAGE_GUIDE.md  
Start with a dry-run:  ./migrate-app.sh <app-name> --dry-run
  
Then follow the complete workflow:  1. ./migrate-app.sh <app-name>
  2. ./validate-migration.sh <app-name>
  3. Test manually in Contentful
  4. ./cleanup-migrated-app.sh <app-name>

📖 Documentation:  
USAGE_GUIDE.md        - Step-by-step instructions (START HERE!)
MIGRATION_README.md   - Technical documentation
<script> --help       - Individual script help

💡 Pro Tips:  
  • Always use --dry-run first to preview changes
  • Use --verbose or --detailed for debugging
  • Check generated reports and logs for details
  • Only run cleanup after thorough testing!

🔍 Available Apps in marketplace-partner-apps:
EOF

    if [[ -d "../../marketplace-partner-apps/apps" ]]; then
        # Get all apps and display them in columns
        local apps=($(ls -1 "../../marketplace-partner-apps/apps/" 2>/dev/null))
        local total_apps=${#apps[@]}
        
        if [[ $total_apps -eq 0 ]]; then
            echo "  No apps found in marketplace-partner-apps/apps/"
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
            echo "  Total: $total_apps apps available"
        fi
    else
        echo "  marketplace-partner-apps not found at ../../marketplace-partner-apps"
    fi

    cat << EOF

📁 Migration Status:
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

=============================================================================
For detailed documentation: cat USAGE_GUIDE.mdFor script help: <script-name> --help
⚠️  Remember: Always test thoroughly before running cleanup!
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
