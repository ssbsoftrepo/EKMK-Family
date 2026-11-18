#!/usr/bin/env bash
# ==============================================================================
# EKMK Family Tree - One-Click Production Deployment to AWS Lightsail
# Target Server: 13.200.119.156 (Ubuntu)
# ==============================================================================
set -euo pipefail

SERVER_USER="ubuntu"
SERVER_IP="13.200.119.156"
REMOTE_DIR="/home/ubuntu/Family-Tree-EKMK"

# Automatically find any .pem key in ~/Downloads if not specified
KEY_PATH="${KEY_PATH:-}"
if [ -z "$KEY_PATH" ]; then
    KEY_PATH=$(ls -1 "$HOME"/Downloads/*.pem 2>/dev/null | head -n 1 || true)
fi

if [ -z "$KEY_PATH" ] || [ ! -f "$KEY_PATH" ]; then
    echo "❌ Error: Could not find .pem key in ~/Downloads!"
    echo "   Please specify KEY_PATH, e.g.: KEY_PATH=~/Downloads/your-key.pem ./deploy-to-aws.sh"
    exit 1
fi

echo "=========================================================="
echo "  🚀 Starting EKMK Family Tree Deployment to AWS ($SERVER_IP)"
echo "  🔑 Using SSH Key: $KEY_PATH"
echo "=========================================================="

chmod 400 "$KEY_PATH"
SSH_CMD="ssh -i $KEY_PATH -o StrictHostKeyChecking=accept-new"
RSYNC_SSH="ssh -i $KEY_PATH -o StrictHostKeyChecking=accept-new"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 1. Build Backend
echo ""
echo "📦 [1/4] Building Spring Boot Backend..."
cd "$SCRIPT_DIR/backend"
mkdir -p /tmp/gradle_deploy_home/caches /tmp/gradle_deploy_home/wrapper
ln -sfn "$HOME/.gradle/caches/modules-2" /tmp/gradle_deploy_home/caches/modules-2 2>/dev/null || true
ln -sfn "$HOME/.gradle/wrapper/dists" /tmp/gradle_deploy_home/wrapper/dists 2>/dev/null || true
./gradlew -g /tmp/gradle_deploy_home --project-cache-dir /tmp/gradle_project_cache bootJar -x test
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

# 4. Sync files to AWS
echo ""
echo "📡 [4/4] Syncing artifacts to $SERVER_USER@$SERVER_IP:$REMOTE_DIR..."
$SSH_CMD "$SERVER_USER@$SERVER_IP" "mkdir -p $REMOTE_DIR/docs/migrations $REMOTE_DIR/uploads/photos $REMOTE_DIR/backend $REMOTE_DIR/frontend/dist $REMOTE_DIR/admin/dist"
rsync -avz -e "$RSYNC_SSH" --progress "$SCRIPT_DIR/backend/build/libs/backend-0.0.1-SNAPSHOT.jar" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/backend/familytree-backend.jar"
rsync -avz -e "$RSYNC_SSH" --progress "$SCRIPT_DIR/backend/src/main/resources/application-aws.properties" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/backend/application-prod.properties"
rsync -avz -e "$RSYNC_SSH" --delete "$SCRIPT_DIR/frontend/dist/" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/frontend/dist/"
rsync -avz -e "$RSYNC_SSH" --delete "$SCRIPT_DIR/admin/dist/" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/admin/dist/"
rsync -avz -e "$RSYNC_SSH" "$SCRIPT_DIR/uploads/" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/uploads/"
mkdir -p "$SCRIPT_DIR/docs/migrations"
rsync -avz -e "$RSYNC_SSH" "$SCRIPT_DIR/docs/migrations/" "$SERVER_USER@$SERVER_IP:$REMOTE_DIR/docs/migrations/"

# 5. Restart backend service & reload Nginx
echo ""
echo "🔄 Restarting Family Tree backend & reloading Nginx on AWS..."
$SSH_CMD "$SERVER_USER@$SERVER_IP" '
  echo "Restarting backend service..."
  sudo systemctl restart familytree-backend.service

  echo "Reloading Nginx..."
  sudo systemctl reload nginx
'

echo ""
echo "=========================================================="
echo "  ✅ AWS Deployment Completed Successfully!"
echo "=========================================================="
echo "  🌐 Public Family Website:  http://$SERVER_IP:7300"
echo "  🛠️  Admin Management Portal: http://$SERVER_IP:7301"
echo "  🩺 Backend Health Check:     http://$SERVER_IP:7300/api/admin/health"
echo "=========================================================="
