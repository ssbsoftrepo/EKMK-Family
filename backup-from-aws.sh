#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# Backup AWS PostgreSQL Database & Photos to Desktop with Today's Date
# ==============================================================================
DATE=$(date +%Y-%m-%d)
DESKTOP_DIR="$HOME/Desktop"
BACKUP_DIR="$DESKTOP_DIR/family_tree_backup_$DATE"
KEY_PATH="${KEY_PATH:-}"

if [ -z "$KEY_PATH" ]; then
    KEY_PATH=$(ls -1 "$HOME"/Downloads/*.pem 2>/dev/null | head -n 1 || true)
fi

if [ -z "$KEY_PATH" ] || [ ! -f "$KEY_PATH" ]; then
    echo "❌ Error: Could not find .pem key in ~/Downloads!"
    echo "   Please specify KEY_PATH, e.g.: KEY_PATH=~/Downloads/your-key.pem ./backup-from-aws.sh"
    exit 1
fi

chmod 400 "$KEY_PATH"
SSH_CMD="ssh -i $KEY_PATH -o StrictHostKeyChecking=accept-new"
RSYNC_SSH="ssh -i $KEY_PATH -o StrictHostKeyChecking=accept-new"
SERVER="ubuntu@13.200.119.156"

mkdir -p "$BACKUP_DIR"

echo "=========================================================="
echo "  📦 Backing up AWS Family Tree Data for: $DATE"
echo "  🔑 Using SSH Key: $KEY_PATH"
echo "  📁 Destination: $BACKUP_DIR"
echo "=========================================================="

# 1. Dump database on AWS
echo ""
echo "1️⃣  Taking PostgreSQL database dump on AWS..."
$SSH_CMD "$SERVER" "sudo -u postgres pg_dump -d kmk-family -F p --no-owner --no-privileges -f /tmp/kmk_family_$DATE.sql"

# 2. Download SQL dump to Desktop
echo ""
echo "2️⃣  Downloading SQL dump to Desktop..."
scp -i "$KEY_PATH" "$SERVER:/tmp/kmk_family_$DATE.sql" "$BACKUP_DIR/kmk_family_$DATE.sql"
cp "$BACKUP_DIR/kmk_family_$DATE.sql" "$DESKTOP_DIR/kmk_family_backup_$DATE.sql"

# 3. Sync photos from AWS to Desktop
echo ""
echo "3️⃣  Downloading photos from AWS..."
mkdir -p "$BACKUP_DIR/photos"
rsync -avz --progress -e "$RSYNC_SSH" "$SERVER:/home/ubuntu/Family-Tree-EKMK/uploads/photos/" "$BACKUP_DIR/photos/"

# 4. Create a clean compressed archive of photos
echo ""
echo "4️⃣  Creating photos zip/tar archive..."
tar -czf "$DESKTOP_DIR/photos_backup_$DATE.tar.gz" -C "$BACKUP_DIR" photos

echo ""
echo "=========================================================="
echo "  ✅ Backup Complete on your Desktop!"
echo "  📄 Database Dump:  $DESKTOP_DIR/kmk_family_backup_$DATE.sql"
echo "  🖼️  Photos Archive: $DESKTOP_DIR/photos_backup_$DATE.tar.gz"
echo "  📂 Full Folder:    $BACKUP_DIR"
echo "=========================================================="

