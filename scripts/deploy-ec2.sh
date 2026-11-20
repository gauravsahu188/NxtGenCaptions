#!/usr/bin/env bash
# ==============================================================================
# Script: deploy-ec2.sh
# Purpose: Zero-downtime, fast, cached deployment script for nxtgencaptions.com on EC2
# ==============================================================================

set -euo pipefail

# Color output helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. Environment & Path Setup (ensures Node, npm, pm2 are discovered)
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # shellcheck source=/dev/null
  \. "$NVM_DIR/nvm.sh"
fi
export PATH="$PATH:$HOME/.local/bin:/usr/local/bin:/usr/bin"

# Allocate 2GB max memory for Node.js builds to prevent OOM on smaller EC2 instances
export NODE_OPTIONS="--max-old-space-size=2048"

# 2. Identify Root Directory
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"
log "Working in repository root: $ROOT_DIR"

# Ensure logs directory exists
mkdir -p "$ROOT_DIR/logs"

# 3. Pull Latest Changes from Git
log "Fetching latest code from origin/main..."
git fetch origin main
CURRENT_HASH=$(git rev-parse HEAD)
LATEST_HASH=$(git rev-parse origin/main)

log "Current commit: $CURRENT_HASH"
log "Deploying commit: $LATEST_HASH"
git reset --hard origin/main

# 4. Check Environment Configuration
if [ ! -f "$ROOT_DIR/.env.local" ] && [ ! -f "$ROOT_DIR/.env" ]; then
  log_warn "No .env.local found in $ROOT_DIR. Please ensure production environment variables are configured."
else
  log "Verifying environment symlinks..."
  ln -sf "$ROOT_DIR/.env.local" "$ROOT_DIR/frontend/.env.local" 2>/dev/null || true
  ln -sf "$ROOT_DIR/.env.local" "$ROOT_DIR/backend/.env" 2>/dev/null || true
fi

# 5. Fast Dependency Installation (Using Cache)
log "Installing backend dependencies (cached)..."
(cd "$ROOT_DIR/backend" && npm ci --prefer-offline --no-audit)

log "Installing frontend dependencies (cached)..."
(cd "$ROOT_DIR/frontend" && npm ci --prefer-offline --no-audit)

# 6. Generate Prisma Clients
log "Generating Prisma clients for Backend and Frontend..."
(cd "$ROOT_DIR/backend" && npx prisma generate)
(cd "$ROOT_DIR/frontend" && npx prisma generate)

# 7. Run Database Migrations
if [ "${SKIP_MIGRATIONS:-false}" != "true" ]; then
  log "Applying Prisma database migrations..."
  (cd "$ROOT_DIR/frontend" && npx prisma migrate deploy)
else
  log_warn "Database migrations skipped (SKIP_MIGRATIONS=true)."
fi

# 8. Build Applications Concurrently on EC2
log "Building Backend TypeScript..."
(cd "$ROOT_DIR/backend" && npm run build)

log "Building Frontend Next.js production bundle..."
(cd "$ROOT_DIR/frontend" && npm run build)

# 9. Zero-Downtime Reload via PM2
log "Reloading application services via PM2..."
if pm2 describe nxtgen-frontend >/dev/null 2>&1; then
  pm2 reload "$ROOT_DIR/ecosystem.config.js" --update-env
else
  pm2 start "$ROOT_DIR/ecosystem.config.js"
fi
pm2 save

# 10. Post-Deployment Verification & Health Checks
log "Verifying health checks..."
sleep 4

# Check backend health endpoint
BACKEND_HEALTH=$(curl -fsS http://localhost:3001/api/health || echo "FAILED")
if [ "$BACKEND_HEALTH" = "FAILED" ]; then
  log_error "Backend health check failed at http://localhost:3001/api/health"
  pm2 logs nxtgen-backend --lines 20 --nostream
  exit 1
fi
log_success "Backend health check passed!"

# Check frontend port 3000
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
if [ "$FRONTEND_STATUS" -ge 400 ] || [ "$FRONTEND_STATUS" -eq 000 ]; then
  log_error "Frontend returned HTTP status $FRONTEND_STATUS at http://localhost:3000"
  pm2 logs nxtgen-frontend --lines 20 --nostream
  exit 1
fi
log_success "Frontend health check passed (HTTP $FRONTEND_STATUS)!"

log_success "🚀 Deployment to nxtgencaptions.com completed successfully at $(date)!"
