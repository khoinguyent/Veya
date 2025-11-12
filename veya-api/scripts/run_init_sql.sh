#!/bin/bash
# Script to run init.sql on the database
# This seeds the personalization templates

set -e

echo "============================================================================"
echo "Running init.sql to seed personalization templates..."
echo "============================================================================"

# Check if running in Docker or locally
if [ -f /.dockerenv ] || [ -n "$DOCKER_CONTAINER" ]; then
    # Running inside Docker container
    echo "Running inside Docker container..."
    psql -U veya_user -d veya -f /app/init.sql
else
    # Running locally - use docker-compose exec
    echo "Running via docker-compose..."
    docker-compose exec -T db psql -U veya_user -d veya -f /docker-entrypoint-initdb.d/init.sql
fi

echo "============================================================================"
echo "✅ init.sql completed successfully!"
echo "============================================================================"

