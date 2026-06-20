#!/bin/bash
set -e

# Edit these two lines to match your server:
SERVER="USER@SERVER"
REMOTE_PATH="/opt/dbrowser"

rsync -av --exclude 'node_modules' --exclude '.git' --exclude 'dist' . $SERVER:$REMOTE_PATH
ssh $SERVER "cd $REMOTE_PATH && docker compose build --build-arg CACHEBUST=\$(date +%s) && docker compose up -d"
echo "Deploy done"
