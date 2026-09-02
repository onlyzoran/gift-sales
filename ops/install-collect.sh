#!/usr/bin/env bash
set -euo pipefail

# Один раз от root на VPS: runtime collector вне git-клона My Machines.
# Не трогает cursor-worker.service, board-watch и /opt/cursor-workers/gift-sales.

if [[ $EUID -ne 0 ]]; then
  echo "запусти от root" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
RUNTIME_ROOT=/var/lib/gift-sales
APP_DIR="$RUNTIME_ROOT/app"
DATA_DIR="$RUNTIME_ROOT/data"
CONFIG="$RUNTIME_ROOT/sources.yaml"
SYSTEMD=/etc/systemd/system

install -d -o cursor-worker -g cursor-worker -m 0755 "$RUNTIME_ROOT"
install -d -o cursor-worker -g cursor-worker -m 0755 "$APP_DIR"
install -d -o cursor-worker -g cursor-worker -m 0755 "$DATA_DIR"

rsync -a --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='data' \
  "$REPO_ROOT/" "$APP_DIR/"

chown -R cursor-worker:cursor-worker "$APP_DIR"
sudo -u cursor-worker -H bash -c "cd '$APP_DIR' && npm ci"

install -o cursor-worker -g cursor-worker -m 0644 "$REPO_ROOT/sources.yaml" "$CONFIG"
install -m 644 "$SCRIPT_DIR/gift-sales-collect.service" "$SYSTEMD/"
install -m 644 "$SCRIPT_DIR/gift-sales-collect.timer" "$SYSTEMD/"
systemctl daemon-reload

echo "Runtime app:  $APP_DIR"
echo "SQLite DB:    $DATA_DIR/quotes.db"
echo "Config:       $CONFIG"
echo "Units:        $SYSTEMD/gift-sales-collect.{service,timer}"
echo
echo "Дальше:"
echo "  systemctl enable --now gift-sales-collect.timer"
echo
echo "После обновления кода на VPS — снова запусти этот скрипт из актуального checkout."
