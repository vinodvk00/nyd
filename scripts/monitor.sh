#!/bin/bash

# Monitoring Script
# Displays real-time status of all services

echo "======================================"
echo "NYD Time Tracking - Service Monitor"
echo "======================================"
echo ""

# Check if services are running
if ! docker compose ps | grep -q "Up"; then
    echo "Warning: Some or all services are not running"
    echo ""
fi

# Service Status
echo "SERVICE STATUS:"
echo "--------------------------------------"
docker compose ps
echo ""

# Health Checks
echo "HEALTH CHECKS:"
echo "--------------------------------------"

# Nginx
if curl -f -s http://localhost/health > /dev/null 2>&1; then
    echo "✓ Nginx: Healthy"
else
    echo "✗ Nginx: Unhealthy"
fi

# Backend
BACKEND_HEALTH=$(curl -f -s http://localhost/api/health 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✓ Backend: Healthy"
else
    echo "✗ Backend: Unhealthy"
fi

# PostgreSQL
if docker compose exec -T postgres pg_isready -U nyduser -d nyd_timetrack > /dev/null 2>&1; then
    echo "✓ PostgreSQL: Healthy"
else
    echo "✗ PostgreSQL: Unhealthy"
fi

echo ""

# Resource Usage
echo "RESOURCE USAGE:"
echo "--------------------------------------"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
echo ""

# Disk Usage
echo "DISK USAGE:"
echo "--------------------------------------"
echo "Docker volumes:"
docker volume ls --filter name=nyd --format "table {{.Name}}\t{{.Driver}}"
echo ""
docker system df
echo ""

# Recent Logs
echo "RECENT LOGS (last 10 lines):"
echo "--------------------------------------"
echo "Backend:"
docker compose logs --tail=5 backend
echo ""
echo "Frontend:"
docker compose logs --tail=5 frontend
echo ""

# Database Stats
echo "DATABASE STATISTICS:"
echo "--------------------------------------"
docker compose exec -T postgres psql -U nyduser -d nyd_timetrack -c "
SELECT
    'Total Tracks' as metric, COUNT(*)::text as value FROM track
UNION ALL
SELECT
    'Total Projects', COUNT(*)::text FROM project
UNION ALL
SELECT
    'Database Size', pg_size_pretty(pg_database_size('nyd_timetrack'))
" 2>/dev/null || echo "Unable to fetch database statistics"

echo ""
echo "======================================"
echo "Press Ctrl+C to exit"
echo "Refresh in 30 seconds..."
echo "======================================"
