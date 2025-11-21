# Deployment Scripts

Helper scripts for deploying and managing the NYD Time Tracking application.

## Prerequisites

All scripts require execution permissions:

```bash
chmod +x scripts/*.sh
```

## Scripts

### 1. install-docker.sh
Installs Docker and Docker Compose on Ubuntu systems.

```bash
./scripts/install-docker.sh
```

After installation, log out and log back in, or run:
```bash
newgrp docker
```

### 2. deploy.sh
Complete deployment script that builds and starts all services.

```bash
./scripts/deploy.sh
```

**What it does:**
- Validates .env configuration
- Builds Docker images
- Starts all services
- Runs health checks
- Displays access URLs

**Prerequisites:**
- .env file configured (copy from .env.example)
- Docker and Docker Compose installed

### 3. backup.sh
Creates a timestamped backup of the PostgreSQL database.

```bash
./scripts/backup.sh
```

**Features:**
- Compressed backup files (.sql.gz)
- Automatic cleanup of old backups (30 days retention)
- Stored in `./backups` directory

**Recommended:** Run daily via cron:
```bash
# Add to crontab
crontab -e

# Backup daily at 2 AM
0 2 * * * cd /path/to/nyd && ./scripts/backup.sh >> ./logs/backup.log 2>&1
```

### 4. restore.sh
Restores database from a backup file.

```bash
./scripts/restore.sh backups/nyd_backup_20250118_120000.sql.gz
```

**Features:**
- Safety backup before restore
- Confirmation prompt
- Handles compressed and uncompressed backups
- Automatically restarts backend service

**Usage:**
```bash
# List available backups
ls -lh backups/

# Restore specific backup
./scripts/restore.sh backups/nyd_backup_YYYYMMDD_HHMMSS.sql.gz
```

### 5. monitor.sh
Real-time monitoring dashboard for all services.

```bash
./scripts/monitor.sh
```

**Displays:**
- Service status
- Health check results
- Resource usage (CPU, memory, network, disk)
- Recent logs
- Database statistics

**Tip:** Run in a separate terminal for continuous monitoring

## Automation Setup

### Daily Backups

```bash
# Add to crontab
crontab -e

# Daily backup at 2 AM
0 2 * * * cd /home/$USER/nyd && ./scripts/backup.sh >> ./logs/backup.log 2>&1
```

### SSL Certificate Renewal (if using Let's Encrypt)

```bash
# Add to crontab
crontab -e

# Daily check and renewal at 3 AM
0 3 * * * cd /home/$USER/nyd && docker compose run --rm certbot renew --quiet && docker compose restart nginx
```

### Monitoring Alerts (optional)

```bash
# Check health every 5 minutes and alert on failure
*/5 * * * * cd /home/$USER/nyd && ./scripts/monitor.sh | grep -q "✗" && echo "Service health check failed" | mail -s "NYD Alert" your-email@example.com
```

## Troubleshooting

### Scripts won't execute

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Check line endings (convert from Windows to Unix if needed)
dos2unix scripts/*.sh
```

### Permission denied on Docker commands

```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker

# Or run with sudo (not recommended)
sudo ./scripts/deploy.sh
```

### Backup fails

```bash
# Check if PostgreSQL is running
docker compose ps postgres

# Check disk space
df -h

# Check logs
docker compose logs postgres
```

## Integration with CI/CD

These scripts can be integrated into CI/CD pipelines:

**GitHub Actions Example:**
```yaml
- name: Deploy to GCP
  run: |
    gcloud compute ssh vm-name --command "cd /path/to/nyd && git pull && ./scripts/deploy.sh"
```

**Cloud Build Example:**
```yaml
steps:
  - name: 'gcr.io/cloud-builders/gcloud'
    args: ['compute', 'ssh', 'vm-name', '--command', 'cd /path/to/nyd && ./scripts/deploy.sh']
```

## Quick Reference

```bash
# First time setup
./scripts/install-docker.sh
cp .env.example .env
nano .env
./scripts/deploy.sh

# Daily operations
./scripts/monitor.sh        # Check status
./scripts/backup.sh         # Manual backup
docker compose logs -f      # View logs
docker compose restart      # Restart services

# Updates
git pull
docker compose build
docker compose up -d

# Emergency restore
./scripts/restore.sh backups/nyd_backup_YYYYMMDD.sql.gz
```

## Support

For detailed deployment instructions, see `DEPLOYMENT.md` in the project root.
