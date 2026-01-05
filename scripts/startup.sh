#!/bin/sh
set -e

echo "Starting Beat The Kings..."

# Run database migrations (safe to run on every deploy)
echo "Running database migrations..."
./node_modules/.bin/drizzle-kit migrate

# Check if we should seed (only if SEED_DATABASE=true)
if [ "$SEED_DATABASE" = "true" ]; then
  echo "Seeding database..."
  ./node_modules/.bin/tsx src/db/seed.ts
  echo "Seeding complete"
fi

# Start the application
echo "Starting server..."
exec node server.js
