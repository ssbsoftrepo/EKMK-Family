#!/usr/bin/env bash
# ==============================================================================
# EKMK Family Tree - One-Click Production Deployment Script
# Target Server: 192.168.1.70 (Static IP: 136.185.1.251)
# ==============================================================================
set -euo pipefail

SERVER_USER="ssb"
SERVER_IP="192.168.1.70"
REMOTE_DIR="/home/ssb/Family-Tree-EKMK"

echo "=========================================================="
echo "  🚀 Starting EKMK Family Tree Deployment to $SERVER_IP"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Build Backend
echo ""
echo "📦 [1/4] Building Spring Boot Backend..."
cd "$SCRIPT_DIR/backend"
./gradlew --no-daemon clean bootJar -x test
cd "$SCRIPT_DIR"

# 2. Build Frontend
echo ""
echo "🎨 [2/4] Building Public Frontend Bundle..."
cd "$SCRIPT_DIR/frontend"
npm run build
cd "$SCRIPT_DIR"

# 3. Build Admin
echo ""
echo "🛠️  [3/4] Building Admin Dashboard Bundle..."
cd "$SCRIPT_DIR/admin"
npm run build
cd "$SCRIPT_DIR"

# 4. Sync files to remote server
echo ""
echo "📡 [4/4] Syncing artifacts to $SERVER_USER@$SERVER_IP:$REMOTE_DIR..."
ssh "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR/docs/migrations $REMOTE_DIR/uploads/photos $REMOTE_DIR/backend $REMOTE_DIR/frontend/dist $REMOTE_DIR/admin/dist"
rsync -avz --progress "$SCRIPT_DIR/backend/build/libs/backend-0.0.1-SNAPSHOT.jar" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/backend/familytree-backend.jar"
rsync -avz --progress "$SCRIPT_DIR/backend/src/main/resources/application-prod.properties" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/backend/application-prod.properties"
rsync -avz --delete "$SCRIPT_DIR/frontend/dist/" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/frontend/dist/"
rsync -avz --delete "$SCRIPT_DIR/admin/dist/" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/admin/dist/"
rsync -avz "$SCRIPT_DIR/uploads/" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/uploads/"
mkdir -p "$SCRIPT_DIR/docs/migrations"
rsync -avz "$SCRIPT_DIR/docs/migrations/" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/docs/migrations/"

# 5. Enable auto-start on boot, restart backend & reload Nginx
echo ""
echo "🔄 Enabling auto-start on server boot, restarting backend & reloading Nginx..."
ssh "$SERVER_USER@$SERVER_IP" '
  echo "Enabling automatic startup on server boot for PostgreSQL, Nginx, and Backend..."
  echo ssb | sudo -S systemctl enable postgresql
  echo ssb | sudo -S systemctl enable nginx
  echo ssb | sudo -S systemctl enable familytree-backend.service

  echo "Restarting backend service..."
  echo ssb | sudo -S systemctl restart familytree-backend.service

  echo "Reloading Nginx..."
  echo ssb | sudo -S systemctl reload nginx
'

echo ""
echo "=========================================================="
echo "  ✅ Deployment Completed Successfully!"
echo "=========================================================="
echo "  🌐 Local Network Access:"
echo "     - Frontend:  http://$SERVER_IP:7300  (or http://$SERVER_IP:5173)"
echo "     - Admin:     http://$SERVER_IP:7301  (or http://$SERVER_IP:5174)"
echo "     - Backend:   http://$SERVER_IP:7300/api/admin/health"
echo ""
echo "  🌍 Global Access (Via Static IP 136.185.1.251 after Port Forwarding):"
echo "     - Frontend:  http://136.185.1.251:7300"
echo "     - Admin:     http://136.185.1.251:7301"
echo "=========================================================="
