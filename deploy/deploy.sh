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
for migration in "$APP_DIR"/server/src/migrations/*.sql; do
  echo "  -> $(basename "$migration")"
  PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST:-localhost}" -U "${DB_USER}" -d "${DB_NAME}" -f "$migration" 2>&1 | grep -v "already exists" || true
done

echo "Ensuring uploads directory..."
mkdir -p "$APP_DIR/uploads/meeting-notes"
chown -R "$(whoami)" "$APP_DIR/uploads" 2>/dev/null || true

echo "Building client..."
cd "$APP_DIR/client" && npm run build

echo "Building server..."
cd "$APP_DIR/server" && npm run build

echo "Restarting server..."
pm2 restart dc-web-server

echo "✓ Deploy complete!"
