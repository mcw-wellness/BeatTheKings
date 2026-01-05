#!/bin/sh
set -e

echo "🚀 Starting Beat The Kings..."

# Run database migrations (safe to run on every deploy)
echo "📦 Running database migrations..."
npm run db:push

# Check if we should seed (only if SEED_DATABASE=true)
if [ "$SEED_DATABASE" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run db:seed
  echo "✅ Seeding complete"
fi

# Start the application
echo "🎮 Starting server..."
exec node server.js
