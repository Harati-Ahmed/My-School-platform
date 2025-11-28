#!/bin/bash
# Run seed script via psql
# 
# Usage:
#   ./supabase/scripts/run-seed-psql.sh [DATABASE_PASSWORD]
#
# Or set DATABASE_PASSWORD environment variable:
#   export DATABASE_PASSWORD=your-password
#   ./supabase/scripts/run-seed-psql.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SEED_FILE="$SCRIPT_DIR/../seed_arabic_data.sql"

# Get password from argument or environment variable
DB_PASSWORD="${1:-${DATABASE_PASSWORD}}"

if [ -z "$DB_PASSWORD" ]; then
    echo "❌ Error: Database password required"
    echo ""
    echo "Usage:"
    echo "  $0 [DATABASE_PASSWORD]"
    echo ""
    echo "Or set environment variable:"
    echo "  export DATABASE_PASSWORD=your-password"
    echo "  $0"
    echo ""
    echo "Get password from: Supabase Dashboard → Settings → Database → Connection string"
    exit 1
fi

# Project reference from .env.local or use default
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    SUPABASE_URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" "$PROJECT_ROOT/.env.local" | cut -d'=' -f2 | tr -d '"' | tr -d "'")
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed 's|https://||' | sed 's|\.supabase\.co||')
else
    echo "❌ Error: .env.local not found"
    exit 1
fi

if [ -z "$PROJECT_REF" ]; then
    echo "❌ Error: Could not extract project reference"
    exit 1
fi

CONNECTION_STRING="postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres"

echo "🚀 Running seed script via psql..."
echo "📄 File: $SEED_FILE"
echo "🔗 Project: $PROJECT_REF"
echo ""

if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql not found. Install PostgreSQL client."
    exit 1
fi

psql "$CONNECTION_STRING" -f "$SEED_FILE"

echo ""
echo "✅ Seed script completed!"

