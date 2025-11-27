#!/bin/bash

# GitLab Retry Service - Configuration Reload Script
# This script reloads configuration by sending SIGHUP signal to PM2 process

APP_NAME="gitlab-retry"

echo "Reloading configuration for $APP_NAME..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "Error: PM2 is not installed or not in PATH"
    exit 1
fi

# Check if the app is running
if ! pm2 list | grep -q "$APP_NAME"; then
    echo "Error: $APP_NAME is not running in PM2"
    echo "Start it first with: pm2 start npm --name \"$APP_NAME\" -- start"
    exit 1
fi

# Send SIGHUP signal
echo "Sending SIGHUP signal..."
pm2 sendSignal SIGHUP "$APP_NAME"

if [ $? -eq 0 ]; then
    echo "✓ Configuration reload signal sent successfully"
    echo ""
    echo "Showing recent logs (press Ctrl+C to exit):"
    sleep 1
    pm2 logs "$APP_NAME" --lines 20
else
    echo "✗ Failed to send reload signal"
    exit 1
fi
