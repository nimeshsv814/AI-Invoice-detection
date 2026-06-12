#!/bin/bash
# ==============================================================================
# AI-Powered Invoice Processing & Fraud Detection Platform
# Startup & Local Deployment Script
# ==============================================================================
set -e

echo "========================================================================"
echo " Starting Platform Services Deployment locally..."
echo "========================================================================"

# Check if .env file exists and export environment variables
if [ -f .env ]; then
  echo "Loading environment variables from .env file..."
  export $(grep -v '^#' .env | xargs)
else
  echo "Warning: .env file not found, using default service configs."
fi

# Set default values for DB
DB_USER=${DB_USER:-invoiceadmin}
DB_NAME=${DB_NAME:-invoicedb}

echo "Step 1: Building Docker images sequentially..."
services=(
  "auth-service"
  "invoice-service"
  "ocr-service"
  "duplicate-detection-service"
  "fraud-detection-service"
  "approval-service"
  "vendor-service"
  "notification-service"
  "analytics-service"
  "frontend"
)

for s in "${services[@]}"; do
  echo "Building image for service: $s..."
  docker compose build --no-cache "$s"
done

echo "Step 2: Starting PostgreSQL Database and Redis..."
docker compose up -d postgres redis

echo "Step 3: Waiting for PostgreSQL Database to become healthy..."
until docker exec invoice-postgres pg_isready -U "$DB_USER" -d "$DB_NAME" > /dev/null 2>&1; do
  echo "PostgreSQL is starting up... waiting 2s..."
  sleep 2
done
echo "PostgreSQL is ready and healthy!"

echo "Step 4: Ensuring Database schema and seed data are applied (idempotent)..."
docker exec -i invoice-postgres psql -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/01-schema.sql
docker exec -i invoice-postgres psql -U "$DB_USER" -d "$DB_NAME" -f /docker-entrypoint-initdb.d/02-seed.sql
echo "Database schema and seed data checked/applied successfully!"

echo "Step 5: Launching all microservices and frontend..."
docker compose up -d

echo "========================================================================"
echo " Platform is successfully started!"
echo " Web Frontend:    http://localhost:3000"
echo " Auth Service:    http://localhost:3001"
echo " Invoice Service: http://localhost:3002"
echo " OCR Service:     http://localhost:3003"
echo "========================================================================"
