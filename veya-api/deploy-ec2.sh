#!/bin/bash
# Deployment script for EC2/Droplet deployment
# Usage: ./deploy-ec2.sh

set -e

echo "🚀 Deploying Veya API to EC2/Droplet..."

# Build Docker image
echo "📦 Building Docker image..."
docker build -t veya-api:latest .

# Tag for registry (if using Docker Hub or ECR)
# docker tag veya-api:latest your-registry/veya-api:latest
# docker push your-registry/veya-api:latest

# Or save and transfer image directly
echo "💾 Saving Docker image..."
docker save veya-api:latest | gzip > veya-api.tar.gz

echo "✅ Image saved to veya-api.tar.gz"
echo ""
echo "Next steps:"
echo "1. Transfer veya-api.tar.gz to your server:"
echo "   scp veya-api.tar.gz user@your-server:/path/to/app/"
echo ""
echo "2. On your server, load the image:"
echo "   docker load < veya-api.tar.gz"
echo ""
echo "3. Run with docker-compose:"
echo "   docker-compose up -d"
echo ""
echo "Or run directly:"
echo "   docker run -d -p 8000:8000 --env-file .env veya-api:latest"

