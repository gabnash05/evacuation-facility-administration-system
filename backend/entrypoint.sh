#!/bin/bash
set -e

DB_HOST="${DB_HOST:-db}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
MAX_RETRIES="${DB_WAIT_RETRIES:-30}"
RETRY_COUNT=0

echo "Waiting for PostgreSQL at ${DB_HOST}:${DB_PORT}..."
while ! pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER"; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "Error: PostgreSQL not available after $MAX_RETRIES attempts. Exiting."
        exit 1
    fi
    sleep 2
    echo "Still waiting for PostgreSQL... (attempt $RETRY_COUNT/$MAX_RETRIES)"
done

echo "PostgreSQL is ready!"

echo "Running database setup..."
python database/setup_db.py

echo "Starting Gunicorn..."
exec gunicorn --bind 0.0.0.0:5000 --workers 2 run:app