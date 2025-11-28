#!/bin/bash

# =============================================
# Production Migration Runner Script
# =============================================
# This script runs all production migrations
# in the correct order for the Tilmeedhy-Live project
# =============================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}🚀 Tilmeedhy Production Migration Runner${NC}"
echo -e "${BLUE}=============================================${NC}\n"

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase CLI not found${NC}"
    echo -e "Install it with: ${YELLOW}npm install -g supabase${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}\n"

# Navigate to frontend directory
cd "$(dirname "$0")"
echo -e "${BLUE}📁 Working directory: $(pwd)${NC}\n"

# Check if project is linked
if [ ! -f ".supabase/project.toml" ]; then
    echo -e "${YELLOW}⚠️  Project not linked yet${NC}"
    echo -e "${BLUE}📋 To link your project, run:${NC}"
    echo -e "   ${YELLOW}supabase link --project-ref YOUR_PROJECT_REF${NC}\n"
    echo -e "${BLUE}To get your project ref:${NC}"
    echo -e "   1. Go to Supabase Dashboard → Settings → General"
    echo -e "   2. Copy the 'Reference ID' (not the full URL)"
    echo -e "   3. Run: supabase link --project-ref YOUR_REF_ID\n"
    exit 1
fi

echo -e "${GREEN}✅ Project linked${NC}\n"

# Get database password
if [ -z "$DATABASE_PASSWORD" ]; then
    echo -e "${YELLOW}📝 Enter database password for Tilmeedhy-Live:${NC}"
    read -s DATABASE_PASSWORD
    echo ""
fi

# List of migrations to run in order
MIGRATIONS=(
    "20240101_initial_schema.sql"
    "20240102_row_level_security.sql"
    "20240103_functions_and_triggers.sql"
    "20240105_make_subjects_global.sql"
    "20240106_fix_subjects_rls_global.sql"
    "20241112_fix_notifications_rls.sql"
    "20241112_refine_rls_policies.sql"
    "20241119_teacher_subject_classes.sql"
    "20241202_class_schedules.sql"
    "20241203_teacher_grade_levels.sql"
    "20241205_teacher_class_assignments.sql"
    "20241206_core_data_indexes.sql"
    "20241206_audit_logs_indexes.sql"
    "20241206_schedule_indexes.sql"
    "20241206_rls_performance_patch.sql"
    "20241206_school_overview_stats_enhanced.sql"
)

echo -e "${BLUE}📋 Migrations to run: ${#MIGRATIONS[@]} files${NC}\n"

# Confirm before proceeding
read -p "Continue with migrations? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}❌ Cancelled${NC}"
    exit 1
fi

# Run migrations
SUCCESS_COUNT=0
FAILED_COUNT=0
FAILED_MIGRATIONS=()

for i in "${!MIGRATIONS[@]}"; do
    migration="${MIGRATIONS[$i]}"
    migration_num=$((i + 1))
    migration_path="supabase/migrations/$migration"
    
    echo -e "\n${BLUE}[$migration_num/${#MIGRATIONS[@]}] Running: ${migration}${NC}"
    
    if [ ! -f "$migration_path" ]; then
        echo -e "${RED}❌ File not found: $migration_path${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        FAILED_MIGRATIONS+=("$migration")
        continue
    fi
    
    # Run migration using Supabase CLI
    if supabase db push --file "$migration_path" --password "$DATABASE_PASSWORD" 2>&1; then
        echo -e "${GREEN}✅ Success: $migration${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}❌ Failed: $migration${NC}"
        FAILED_COUNT=$((FAILED_COUNT + 1))
        FAILED_MIGRATIONS+=("$migration")
        
        # Ask if user wants to continue
        read -p "Continue with next migration? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}❌ Stopped by user${NC}"
            break
        fi
    fi
done

# Summary
echo -e "\n${BLUE}=============================================${NC}"
echo -e "${BLUE}📊 Migration Summary${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "${GREEN}✅ Successful: $SUCCESS_COUNT${NC}"
echo -e "${RED}❌ Failed: $FAILED_COUNT${NC}"

if [ ${#FAILED_MIGRATIONS[@]} -gt 0 ]; then
    echo -e "\n${RED}Failed migrations:${NC}"
    for failed in "${FAILED_MIGRATIONS[@]}"; do
        echo -e "  - ${RED}$failed${NC}"
    done
fi

if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}🎉 All migrations completed successfully!${NC}"
else
    echo -e "\n${YELLOW}⚠️  Some migrations failed. Please review errors above.${NC}"
fi

