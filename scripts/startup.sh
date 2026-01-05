#!/bin/sh
set -e

echo "Starting Beat The Kings..."

# Run database migrations (safe to run on every deploy)
echo "Running database migrations..."
npx drizzle-kit push

# Check if we should seed (only if SEED_DATABASE=true)
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  npx tsx src/db/seed.ts
  echo "Seeding complete"
fi

# Start the application
echo "Starting server..."
exec node server.js
