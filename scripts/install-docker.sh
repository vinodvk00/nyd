#!/bin/bash

# Docker and Docker Compose Installation Script for Ubuntu
# Compatible with Ubuntu 20.04, 22.04, and later

set -e  # Exit on error

echo "======================================"
echo "Docker Installation Script"
echo "======================================"
echo ""

# Check if running on Ubuntu
if [ ! -f /etc/os-release ]; then
    echo "Error: Cannot detect OS"
    exit 1
fi

source /etc/os-release
if [[ "$ID" != "ubuntu" ]]; then
    echo "Warning: This script is designed for Ubuntu"
    echo "Detected OS: $ID"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if Docker is already installed
if command -v docker &> /dev/null; then
    echo "Docker is already installed:"
    docker --version
    read -p "Reinstall? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

echo "1. Updating package index..."
sudo apt update

echo ""
echo "2. Installing prerequisites..."
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release \
    software-properties-common

echo ""
echo "3. Adding Docker's official GPG key..."
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo ""
echo "4. Setting up Docker repository..."
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

echo ""
echo "5. Installing Docker Engine..."
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

echo ""
echo "6. Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

echo ""
echo "7. Adding current user to docker group..."
sudo usermod -aG docker $USER

echo ""
echo "======================================"
echo "Installation Complete!"
echo "======================================"
echo ""
docker --version
docker compose version
echo ""
echo "IMPORTANT: You need to log out and log back in for group changes to take effect"
echo "Or run: newgrp docker"
echo ""
echo "Test installation with: docker run hello-world"
echo ""
