#!/bin/sh
set -e

echo "Waiting for PostgreSQL to start..."
until PGPASSWORD=pg_password psql -h postgres -U pguser -d qpg -c '\q'; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - starting application"
exec "$@"