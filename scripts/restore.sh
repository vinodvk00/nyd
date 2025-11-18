#!/bin/bash

# Database Restore Script
# Restores a PostgreSQL database from a backup file

set -e  # Exit on error

echo "======================================"
echo "NYD Database Restore"
echo "======================================"
echo ""

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "Error: No backup file specified"
    echo ""
    echo "Usage: $0 <backup_file>"
    echo ""
    echo "Available backups:"
    ls -lh backups/nyd_backup_*.sql.gz 2>/dev/null || echo "  No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if Docker is running
if ! docker compose ps postgres | grep -q "Up"; then
    echo "Error: PostgreSQL container is not running"
    echo "Start it with: docker compose up -d postgres"
    exit 1
fi

# Get database credentials from .env
if [ ! -f .env ]; then
    echo "Error: .env file not found"
    exit 1
fi

source .env

echo "WARNING: This will replace the current database!"
echo "Backup file: $BACKUP_FILE"
echo ""
read -p "Are you sure you want to continue? (yes/no) " -r
echo
if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Restore cancelled"
    exit 0
fi

echo ""
echo "1. Creating safety backup of current database..."
SAFETY_BACKUP="backups/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
docker compose exec -T postgres pg_dump \
    -U ${DB_USERNAME} \
    -d ${DB_DATABASE} \
    > "$SAFETY_BACKUP"
echo "Safety backup saved to: $SAFETY_BACKUP"

echo ""
echo "2. Stopping backend service..."
docker compose stop backend

echo ""
echo "3. Restoring database..."

# Check if backup is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "Decompressing and restoring..."
    gunzip -c "$BACKUP_FILE" | docker compose exec -T postgres psql -U ${DB_USERNAME}
else
    cat "$BACKUP_FILE" | docker compose exec -T postgres psql -U ${DB_USERNAME}
fi

echo ""
echo "4. Restarting backend service..."
docker compose start backend

echo ""
echo "======================================"
echo "Restore Complete!"
echo "======================================"
echo ""
echo "Safety backup available at: $SAFETY_BACKUP"
echo ""
echo "Verify restoration:"
echo "  docker compose exec postgres psql -U ${DB_USERNAME} -d ${DB_DATABASE} -c 'SELECT COUNT(*) FROM track;'"
echo ""
