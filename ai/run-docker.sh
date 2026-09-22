#!/bin/bash

# Q AI Server Docker Environment Runner
# This script helps you run the appropriate Docker environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    echo -e "${2}${1}${NC}"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_color "❌ Docker is not running. Please start Docker first." "$RED"
        exit 1
    fi
    print_color "✅ Docker is running" "$GREEN"
}

# Function to check if required files exist
check_files() {
    local env=$1
    if [ "$env" = "dev" ]; then
        if [ ! -f "docker-compose.dev.yml" ]; then
            print_color "❌ docker-compose.dev.yml not found" "$RED"
            exit 1
        fi
    elif [ "$env" = "prod" ]; then
        if [ ! -f "docker-compose.prod.yml" ]; then
            print_color "❌ docker-compose.prod.yml not found" "$RED"
            exit 1
        fi
    fi
    print_color "✅ Required files found" "$GREEN"
}

# Function to check environment variables
check_env_vars() {
    local env=$1
    local missing_vars=()
    
    if [ "$env" = "prod" ]; then
        # Check for production environment variables
        if [ ! -f ".env.production" ]; then
            print_color "⚠️  .env.production file not found. Using .env file." "$YELLOW"
            if [ ! -f ".env" ]; then
                print_color "❌ No .env file found. Please create .env or .env.production" "$RED"
                exit 1
            fi
        fi
    else
        # Check for development environment variables
        if [ ! -f ".env" ]; then
            print_color "❌ .env file not found. Please create it from .env.example" "$RED"
            exit 1
        fi
    fi
    
    print_color "✅ Environment variables configured" "$GREEN"
}

# Function to run development environment
run_dev() {
    print_color "\n🚀 Starting Development Environment..." "$BLUE"
    
    check_files "dev"
    check_env_vars "dev"
    
    print_color "\n📦 Building and starting containers..." "$YELLOW"
    docker-compose -f docker-compose.dev.yml up --build -d
}

# Function to run production environment
run_prod() {
    print_color "\n🚀 Starting Production Environment..." "$BLUE"
    
    check_files "prod"
    check_env_vars "prod"
    
    # Build TypeScript first
    print_color "\n🔨 Building TypeScript..." "$YELLOW"
    npm run build:prod
    
    if [ $? -ne 0 ]; then
        print_color "❌ TypeScript build failed" "$RED"
        exit 1
    fi
    
    print_color "✅ TypeScript build completed" "$GREEN"
    
    print_color "\n📦 Building and starting production containers..." "$YELLOW"
    
    # Use production compose file
    if [ -f ".env.production" ]; then
        docker-compose -f docker-compose.prod.yml --env-file .env.production up --build -d
    else
        docker-compose -f docker-compose.prod.yml up --build -d
    fi
}

# Function to stop containers
stop_containers() {
    print_color "\n🛑 Stopping all containers..." "$YELLOW"
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true
    print_color "✅ All containers stopped" "$GREEN"
}

# Main script
clear
print_color "================================================" "$BLUE"
print_color "       Q AI Server - Docker Environment Runner  " "$BLUE"
print_color "================================================" "$BLUE"

# Check Docker first
check_docker

# Show menu
print_color "\nSelect an option:" "$GREEN"
print_color "1) Development Environment (with hot reload)" "$NC"
print_color "2) Production Environment (optimized)" "$NC"
print_color "3) Stop all containers" "$NC"
print_color "4) Exit" "$NC"

# Read user choice
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        run_dev
        ;;
    2)
        run_prod
        ;;
    3)
        stop_containers
        ;;
    4)
        print_color "\n👋 Goodbye!" "$GREEN"
        exit 0
        ;;
    *)
        print_color "\n❌ Invalid choice. Please run the script again." "$RED"
        exit 1
        ;;
esac

# Trap to handle Ctrl+C
trap 'print_color "\n\n🛑 Shutting down containers..." "$YELLOW"; docker-compose down; exit 0' INT

# Keep script running if containers are running
wait