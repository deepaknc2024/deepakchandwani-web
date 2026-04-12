#!/bin/bash
set -euo pipefail

# ============================================================
# Redeploy script — run after git push
# Usage: bash deploy.sh
# ============================================================

APP_DIR="/opt/deepakchandwani-web"
cd "$APP_DIR"

echo "Pulling latest code..."
git pull

echo "Installing dependencies..."
npm install --workspaces

echo "Running migrations..."
source "$APP_DIR/.env"
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST:-localhost}" -U "${DB_USER}" -d "${DB_NAME}" -f "$APP_DIR/server/src/migrations/001_initial.sql" 2>/dev/null

echo "Building client..."
cd "$APP_DIR/client" && npm run build

echo "Building server..."
cd "$APP_DIR/server" && npm run build

echo "Restarting server..."
pm2 restart dc-web-server

echo "✓ Deploy complete!"
