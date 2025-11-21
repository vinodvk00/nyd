#!/bin/bash

# NYD Time Tracking Deployment Script
# This script helps deploy the application on a GCP VM

set -e  # Exit on error

echo "======================================"
echo "NYD Time Tracking Deployment"
echo "======================================"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    echo "Please copy .env.example to .env and configure it:"
    echo "  cp .env.example .env"
    echo "  nano .env"
    exit 1
fi

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Warning: Running as root is not recommended"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    echo "Please run: ./scripts/install-docker.sh"
    exit 1
fi

# Check if Docker Compose is installed
if ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not installed"
    echo "Please run: ./scripts/install-docker.sh"
    exit 1
fi

echo "1. Building Docker images..."
docker compose build --no-cache

echo ""
echo "2. Starting services..."
docker compose up -d

echo ""
echo "3. Waiting for services to be healthy..."
sleep 10

# Check service health
echo ""
echo "4. Checking service status..."
docker compose ps

echo ""
echo "5. Testing endpoints..."

# Test Nginx
if curl -f -s http://localhost/health > /dev/null; then
    echo "✓ Nginx health check passed"
else
    echo "✗ Nginx health check failed"
fi

# Test Backend
if curl -f -s http://localhost/api/health > /dev/null; then
    echo "✓ Backend health check passed"
else
    echo "✗ Backend health check failed"
fi

echo ""
echo "======================================"
echo "Deployment Complete!"
echo "======================================"
echo ""
echo "Access your application:"
echo "  Frontend: http://$(curl -s ifconfig.me)/"
echo "  Backend API: http://$(curl -s ifconfig.me)/api/"
echo ""
echo "Useful commands:"
echo "  View logs: docker compose logs -f"
echo "  Stop services: docker compose down"
echo "  Restart: docker compose restart"
echo ""
echo "Next steps:"
echo "  1. Set up SSL (see DEPLOYMENT.md)"
echo "  2. Configure your domain DNS"
echo "  3. Run initial data sync: curl -X POST http://localhost/api/tracks/sync"
echo ""
