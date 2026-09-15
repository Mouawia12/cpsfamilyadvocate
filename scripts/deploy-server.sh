#!/usr/bin/env bash
# Deploy / update Familist on a VPS (nginx + PHP-FPM, e.g. HestiaCP).
# Run from anywhere, as the site's system user (not root):
#   sudo -u <site-user> bash scripts/deploy-server.sh
# First run: create backend-familist/.env from .env.example (with ADMIN_EMAIL /
# ADMIN_PASSWORD set) before running. Safe to re-run for every update.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND="$ROOT/backend-familist"
FRONTEND="$ROOT/frontend-react-familist"
BRANCH="${BRANCH:-main}"

if [ "$(id -u)" = "0" ] && [ "${ALLOW_ROOT:-0}" != "1" ]; then
  echo "✗ Run as the site user so files stay writable by PHP-FPM: sudo -u <user> bash $0" >&2
  exit 1
fi

node -e 'const [a,b]=process.versions.node.split(".").map(Number); if (a<20||(a===20&&b<19)) { console.error("✗ Node 20.19+ required, found "+process.versions.node); process.exit(1) }'
php -r 'if (PHP_VERSION_ID < 80300) { fwrite(STDERR, "✗ PHP 8.3+ required, found ".PHP_VERSION."\n"); exit(1); }'
[ -f "$BACKEND/.env" ] || { echo "✗ $BACKEND/.env is missing (copy .env.example and fill it)" >&2; exit 1; }

cd "$ROOT"
if [ "${SKIP_PULL:-0}" != "1" ]; then
  echo "→ Pulling $BRANCH"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git pull --ff-only origin "$BRANCH"
fi

cd "$BACKEND"
MAINTENANCE=0
if [ -f vendor/autoload.php ] && php artisan about --only=environment >/dev/null 2>&1; then
  php artisan down --retry=15 >/dev/null && MAINTENANCE=1
fi
trap '[ "$MAINTENANCE" = "1" ] && (cd "$BACKEND" && php artisan up >/dev/null); echo "✗ Deploy failed" >&2' ERR

echo "→ Backend dependencies"
composer install --no-dev --optimize-autoloader --no-interaction --no-progress

echo "→ Frontend build"
cd "$FRONTEND"
[ -f .env ] || cp .env.example .env
npm ci --no-audit --no-fund
npm run build
mkdir -p "$BACKEND/public/assets"
rsync -a --delete dist/assets/ "$BACKEND/public/assets/"
cp dist/index.html dist/favicon.svg "$BACKEND/public/"

echo "→ Database (migrations; launch content only on an empty site)"
cd "$BACKEND"
mkdir -p storage/framework/{cache/data,sessions,views} storage/logs bootstrap/cache public/uploads
php artisan optimize:clear >/dev/null
php artisan familist:install

echo "→ Caches"
php artisan optimize

if [ "$MAINTENANCE" = "1" ]; then php artisan up; fi
trap - ERR
echo "✓ Deployed $(git -C "$ROOT" log --oneline -1)"
