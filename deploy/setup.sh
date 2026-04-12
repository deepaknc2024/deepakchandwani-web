#!/bin/bash
set -euo pipefail

# ============================================================
# Full VPS Setup Script for web.deepakchandwani.com
# Run on a fresh Ubuntu 24.04 VPS as root
# Usage: bash setup.sh <GITHUB_REPO_URL>
# ============================================================

REPO_URL="${1:-https://github.com/deepakchandwani/deepakchandwani-web.git}"
APP_DIR="/opt/deepakchandwani-web"
DB_NAME="dcweb"
DB_USER="dcweb"
DOMAIN="web.deepakchandwani.com"

echo "============================================"
echo "  Setting up web.deepakchandwani.com"
echo "============================================"

# --- 1. System packages ---
echo "[1/10] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# --- 2. Node.js 20 LTS ---
echo "[2/10] Installing Node.js 20..."
if ! command -v node &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y -qq nodejs
fi
echo "  Node.js $(node -v), npm $(npm -v)"

# --- 3. PostgreSQL 16 ---
echo "[3/10] Installing PostgreSQL..."
if ! command -v psql &>/dev/null; then
    apt-get install -y -qq postgresql postgresql-contrib
fi
systemctl enable postgresql
systemctl start postgresql

# --- 4. Create database & user ---
echo "[4/10] Setting up database..."
DB_PASS=$(openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 24)
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"
echo "  Database: ${DB_NAME}, User: ${DB_USER}"
echo "  IMPORTANT: Save this DB password: ${DB_PASS}"

# --- 5. Nginx ---
echo "[5/10] Installing Nginx..."
apt-get install -y -qq nginx
systemctl enable nginx

# --- 6. Certbot ---
echo "[6/10] Installing Certbot..."
apt-get install -y -qq certbot python3-certbot-nginx

# --- 7. PM2 ---
echo "[7/10] Installing PM2..."
npm install -g pm2 2>/dev/null

# --- 8. Clone repo ---
echo "[8/10] Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "  Directory exists, pulling latest..."
    cd "$APP_DIR" && git pull
else
    git clone "$REPO_URL" "$APP_DIR"
fi
cd "$APP_DIR"

# --- 9. Setup .env ---
echo "[9/10] Setting up environment..."
if [ ! -f "$APP_DIR/.env" ]; then
    cp "$APP_DIR/.env.example" "$APP_DIR/.env"
    # Fill in DB credentials
    sed -i "s/^DB_PASSWORD=.*/DB_PASSWORD=${DB_PASS}/" "$APP_DIR/.env"
    sed -i "s/^DB_NAME=.*/DB_NAME=${DB_NAME}/" "$APP_DIR/.env"
    sed -i "s/^DB_USER=.*/DB_USER=${DB_USER}/" "$APP_DIR/.env"
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32 | tr -dc 'a-zA-Z0-9' | head -c 32)
    sed -i "s/^JWT_SECRET=.*/JWT_SECRET=${JWT_SECRET}/" "$APP_DIR/.env"
    echo ""
    echo "  ⚠️  EDIT .env to add your API keys:"
    echo "     nano /opt/deepakchandwani-web/.env"
    echo "     - OPENAI_API_KEY (for voice chatbot)"
    echo "     - GUARDIAN_API_KEY (for news, 'test' works for free tier)"
    echo ""
fi

# --- 10. Build & Deploy ---
echo "[10/10] Building application..."

# Install dependencies
npm install --workspaces

# Run database migrations
PGPASSWORD="${DB_PASS}" psql -h localhost -U "${DB_USER}" -d "${DB_NAME}" -f "$APP_DIR/server/src/migrations/001_initial.sql"

# Build client (React)
cd "$APP_DIR/client" && npm run build

# Build server (TypeScript)
cd "$APP_DIR/server" && npm run build

# Configure Nginx
cp "$APP_DIR/deploy/nginx.conf" "/etc/nginx/sites-available/${DOMAIN}"
ln -sf "/etc/nginx/sites-available/${DOMAIN}" "/etc/nginx/sites-enabled/${DOMAIN}"
rm -f /etc/nginx/sites-enabled/default

# Get SSL certificate
echo "  Obtaining SSL certificate..."
certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email deepakchandwani@yahoo.com --redirect 2>/dev/null || \
    echo "  SSL cert failed — run manually: certbot --nginx -d ${DOMAIN}"

nginx -t && systemctl reload nginx

# Create log directory
mkdir -p /var/log/dc-web

# Start with PM2
cd "$APP_DIR"
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "============================================"
echo "  ✓ Setup complete!"
echo "============================================"
echo ""
echo "  Site: https://${DOMAIN}"
echo "  API:  https://${DOMAIN}/api/health"
echo ""
echo "  Next steps:"
echo "  1. Edit .env: nano ${APP_DIR}/.env"
echo "  2. Add OPENAI_API_KEY for voice chatbot"
echo "  3. Restart: pm2 restart dc-web-server"
echo ""
echo "  Useful commands:"
echo "  - pm2 status         # Check server status"
echo "  - pm2 logs           # View logs"
echo "  - bash ${APP_DIR}/deploy/deploy.sh  # Redeploy"
echo ""
