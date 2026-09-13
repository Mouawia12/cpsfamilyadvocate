#!/usr/bin/env bash
# Builds deploy-package/familist-app.zip for GoDaddy cPanel (no shell needed on
# the server): React build copied into Laravel public/, production vendor/, no
# secrets. See DEPLOY-GUIDE.md for the upload steps.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAGE="$ROOT/deploy-package/familist-app"
OUT="$ROOT/deploy-package/familist-app.zip"

echo "→ Building the React frontend"
npm --prefix "$ROOT/frontend-react-familist" ci --no-audit --no-fund
npm --prefix "$ROOT/frontend-react-familist" run build

echo "→ Running backend tests"
(cd "$ROOT/backend-familist" && php artisan test)

echo "→ Staging the Laravel app"
rm -rf "$STAGE" "$OUT"
mkdir -p "$STAGE"
rsync -a \
  --exclude .env --exclude '.env.*' --exclude node_modules --exclude vendor --exclude tests \
  --exclude 'database/*.sqlite*' --exclude 'storage/logs/*.log' --exclude 'storage/framework/sessions/*' \
  --exclude 'storage/framework/views/*' --exclude 'storage/framework/cache/data/*' \
  --exclude 'public/uploads/*' --exclude 'bootstrap/cache/*.php' --exclude phpunit.xml --exclude .phpunit.cache \
  "$ROOT/backend-familist/" "$STAGE/"
cp "$ROOT/backend-familist/.env.example" "$STAGE/.env.example"
cp "$ROOT/backend-familist/public/uploads/.htaccess" "$STAGE/public/uploads/.htaccess"
cp -R "$ROOT/frontend-react-familist/dist/." "$STAGE/public/"

echo "→ Installing production dependencies"
(cd "$STAGE" && composer install --no-dev --optimize-autoloader --no-interaction --quiet)

echo "→ Zipping"
(cd "$ROOT/deploy-package" && zip -qr "$OUT" familist-app)
rm -rf "$STAGE"
du -h "$OUT"
echo "✓ $OUT"
