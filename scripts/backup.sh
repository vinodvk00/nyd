#!/bin/bash

# Database Backup Script
# Creates timestamped backups of the PostgreSQL database

set -e  # Exit on error

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="nyd_backup_${TIMESTAMP}.sql"
RETENTION_DAYS=30

echo "======================================"
echo "NYD Database Backup"
echo "======================================"
echo ""

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

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

echo "1. Creating backup..."
docker compose exec -T postgres pg_dump \
    -U ${DB_USERNAME} \
    -d ${DB_DATABASE} \
    --clean \
    --if-exists \
    --create \
    > "${BACKUP_DIR}/${BACKUP_FILE}"

# Compress backup
echo ""
echo "2. Compressing backup..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"
BACKUP_FILE="${BACKUP_FILE}.gz"

# Get backup size
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)

echo ""
echo "3. Cleanup old backups (older than ${RETENTION_DAYS} days)..."
find ${BACKUP_DIR} -name "nyd_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(ls -1 ${BACKUP_DIR}/nyd_backup_*.sql.gz 2>/dev/null | wc -l)

echo ""
echo "======================================"
echo "Backup Complete!"
echo "======================================"
echo ""
echo "File: ${BACKUP_DIR}/${BACKUP_FILE}"
echo "Size: ${BACKUP_SIZE}"
echo "Total backups: ${BACKUP_COUNT}"
echo ""
echo "To restore this backup, run:"
echo "  ./scripts/restore.sh ${BACKUP_DIR}/${BACKUP_FILE}"
echo ""
