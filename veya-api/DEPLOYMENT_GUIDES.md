# Veya API - Step-by-Step Deployment Guides

## Quick Start Guide Index

1. [AWS App Runner Deployment](#1-aws-app-runner-deployment)
2. [AWS Lambda Deployment](#2-aws-lambda-deployment)
3. [Docker + EC2/Droplet Deployment](#3-docker--ec2droplet-deployment)

---

## Prerequisites

Before deploying, ensure you have:
- AWS account (for AWS deployments)
- Docker installed (for Docker deployments)
- PostgreSQL database (RDS, Managed DB, or self-hosted)
- Redis instance (ElastiCache, Managed Redis, or self-hosted) - Optional but recommended
- Environment variables configured

---

## 1. AWS App Runner Deployment

### Step 1: Set up RDS PostgreSQL

1. Go to AWS RDS Console
2. Create a PostgreSQL database:
   - Engine: PostgreSQL 15
   - Instance class: db.t3.micro (free tier eligible)
   - Storage: 20GB
   - Database name: `veya`
   - Master username/password: (save these!)
3. Enable **Public access** if needed (or use VPC)
4. Note the endpoint: `your-db.region.rds.amazonaws.com`

### Step 2: Set up Redis (Optional but Recommended)

**Option A: AWS ElastiCache (Recommended for Production)**
1. Go to AWS ElastiCache Console
2. Create Redis cluster:
   - Engine: Redis
   - Node type: cache.t3.micro (for testing) or cache.t3.small (production)
   - Number of nodes: 1
   - Enable automatic backups
3. Note the endpoint: `your-redis-cluster.xxxxx.cache.amazonaws.com:6379`

**Option B: Redis Cloud or Upstash (Managed)**
- Sign up for Redis Cloud or Upstash
- Get connection URL
- Usually includes free tier

**Option C: Skip Redis**
- Set `REDIS_ENABLED=false` in environment variables
- Application will work without Redis (caching disabled)

### Step 3: Prepare Environment Variables

Create these in AWS Systems Manager Parameter Store or Secrets Manager:

```
DATABASE_URL=postgresql://username:password@your-db.region.rds.amazonaws.com:5432/veya
REDIS_URL=redis://your-redis-endpoint:6379/0
REDIS_ENABLED=true
JWT_SECRET_KEY=your-strong-secret-key-min-32-characters
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=10080
API_VERSION=v1
API_PREFIX=/api
CORS_ORIGINS=https://your-frontend-domain.com
```

### Step 4: Push Code to Repository

```bash
# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub (or AWS CodeCommit)
git remote add origin https://github.com/yourusername/veya-api.git
git push -u origin main
```

### Step 5: Create App Runner Service

1. Go to AWS App Runner Console
2. Click "Create service"
3. Choose **Source code repository** (GitHub/CodeCommit)
4. Connect your repository
5. Configure:
   - **Build settings**: Use `apprunner.yaml` (or auto-detect)
   - **Service name**: `veya-api`
   - **Port**: `8000`
   - **Environment variables**: Add all from Step 2
6. Click "Create & deploy"

### Step 6: Access Your API

App Runner will provide a URL like: `https://xxxxx.us-east-1.awsapprunner.com`

Update your mobile app to use this URL!

---

## 2. AWS Lambda Deployment

### Step 1: Install Mangum

```bash
pip install mangum
```

Add to `requirements-lambda.txt`:
```
mangum==0.17.0
# ... rest of requirements.txt
```

### Step 2: Set up RDS PostgreSQL

Same as App Runner Step 1, but **highly recommend using RDS Proxy**:
1. Create RDS Proxy in RDS Console
2. Configure connection pooling (helps with Lambda cold starts)

### Step 2b: Set up Redis

For Lambda, use **AWS ElastiCache** or **Upstash** (serverless Redis):
- ElastiCache: Same as App Runner Step 2
- Upstash: Better for serverless, pay-per-use pricing

### Step 3: Update Environment Variables

Add Redis URL to your Lambda environment variables:
```
REDIS_URL=redis://your-redis-endpoint:6379/0
REDIS_ENABLED=true
```

### Step 4: Package Lambda Function

```bash
# Install dependencies
pip install -r requirements-lambda.txt -t package/

# Copy application code
cp -r app package/
cp lambda_handler.py package/

# Create deployment package
cd package
zip -r ../veya-api-lambda.zip .
cd ..
```

### Step 5: Create Lambda Function

1. Go to AWS Lambda Console
2. Create function:
   - Runtime: Python 3.11
   - Architecture: x86_64
   - Handler: `lambda_handler.lambda_handler`
3. Upload `veya-api-lambda.zip`
4. Configure environment variables (same as App Runner)
5. Set timeout: 30 seconds (or higher if needed)
6. Set memory: 512MB (or more)

### Step 6: Set up API Gateway

1. Go to API Gateway Console
2. Create REST API (or HTTP API for simpler setup)
3. Create resource and methods
4. Integrate with Lambda function
5. Deploy API to stage (e.g., `prod`)
6. Note the API endpoint URL

### Step 7: Configure RDS Proxy (Important!)

Lambda has connection limits. Use RDS Proxy:
1. Create RDS Proxy in RDS Console
2. Connect Lambda to Proxy instead of RDS directly
3. Update `DATABASE_URL` to use proxy endpoint

---

## 3. Docker + EC2/Droplet Deployment

### Option A: DigitalOcean Droplet

#### Step 1: Create Droplet

1. Go to DigitalOcean, create Droplet:
   - Image: Ubuntu 22.04
   - Plan: Basic ($12/month, 2GB RAM)
   - Region: Choose closest to users
   - Add SSH key
2. Note the IP address

#### Step 2: Set up Server

```bash
# SSH into server
ssh root@your-droplet-ip

# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose-plugin -y

# Create app directory
mkdir -p /opt/veya-api
cd /opt/veya-api
```

#### Step 3: Set up PostgreSQL and Redis

**Option 1: Self-hosted (same server) - Recommended for Development**
```bash
# Docker Compose will handle both PostgreSQL and Redis (see docker-compose.yml)
# No additional setup needed!
```

**Option 2: Managed Database (Recommended for Production)**
1. Create Managed PostgreSQL in DigitalOcean
2. Create Managed Redis in DigitalOcean (or use Redis Cloud/Upstash)
3. Get connection strings
4. Update `.env` file with:
   ```
   DATABASE_URL=postgresql://...
   REDIS_URL=redis://...
   ```

#### Step 4: Transfer Files

```bash
# On your local machine
scp -r veya-api/* root@your-droplet-ip:/opt/veya-api/

# Or use git
git clone https://github.com/yourusername/veya-api.git /opt/veya-api
```

#### Step 5: Configure Environment

```bash
# On server
cd /opt/veya-api
nano .env

# Add:
DATABASE_URL=postgresql://user:password@db:5432/veya
JWT_SECRET_KEY=your-secret-key
# ... etc
```

#### Step 6: Deploy

```bash
# Start services
docker-compose up -d

# Check logs
docker-compose logs -f

# Verify API is running
curl http://localhost:8000/health
```

#### Step 7: Set up Nginx (Production)

```bash
# Install Nginx
apt install nginx certbot python3-certbot-nginx -y

# Copy nginx config
cp nginx.conf /etc/nginx/sites-available/veya-api
ln -s /etc/nginx/sites-available/veya-api /etc/nginx/sites-enabled/

# Test and reload
nginx -t
systemctl reload nginx

# Set up SSL (if you have a domain)
certbot --nginx -d your-domain.com
```

#### Step 8: Set up Firewall

```bash
# Allow SSH, HTTP, HTTPS
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Option B: AWS EC2

#### Step 1: Launch EC2 Instance

1. Go to EC2 Console
2. Launch instance:
   - AMI: Ubuntu 22.04 LTS
   - Instance type: t3.small
   - Key pair: Create or select existing
   - Security group: Allow SSH (22), HTTP (80), HTTPS (443)
3. Launch instance

#### Step 2: Set up Server

Same as DigitalOcean Step 2, but use:
```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

#### Step 3: Set up RDS

1. Create RDS PostgreSQL instance (as in App Runner Step 1)
2. Update security group to allow EC2 access
3. Use RDS endpoint in `.env`

#### Step 4-8: Follow DigitalOcean steps (same process)

---

## Post-Deployment Checklist

- [ ] API is accessible at expected URL
- [ ] Health check endpoint (`/health`) returns 200
- [ ] Database connections work
- [ ] Environment variables are set correctly
- [ ] SSL/HTTPS is configured (production)
- [ ] CORS is configured for your frontend domain
- [ ] Monitoring/logging is set up
- [ ] Backups are configured (database)
- [ ] Firewall/security groups are configured
- [ ] Domain name is pointed to server (if applicable)

---

## Monitoring & Maintenance

### Logs

**App Runner / Lambda:**
- CloudWatch Logs automatically available

**Docker:**
```bash
docker-compose logs -f api
```

### Updates

**App Runner:**
- Automatic on git push (if configured)
- Or manual redeploy from console

**Lambda:**
```bash
# Rebuild and upload new package
zip -r veya-api-lambda.zip .
# Upload via console or AWS CLI
```

**Docker:**
```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build
```

### Database Backups

- **RDS**: Automated backups enabled by default
- **Self-hosted**: Set up cron job:
```bash
0 2 * * * docker exec veya-db pg_dump -U veya_user veya > /backup/veya-$(date +\%Y\%m\%d).sql
```

---

## Troubleshooting

### Common Issues

1. **Database connection errors**
   - Check security groups/firewall rules
   - Verify DATABASE_URL format
   - Check database is accessible

2. **CORS errors**
   - Update `allow_origins` in `main.py`
   - Add your frontend domain

3. **Lambda cold starts**
   - Use RDS Proxy
   - Increase memory allocation
   - Consider App Runner instead

4. **High costs**
   - Monitor CloudWatch metrics
   - Optimize database queries
   - Use reserved instances for predictable workloads

---

## Cost Optimization Tips

1. **Use managed databases** - Better than self-hosting for most cases
2. **Set up auto-scaling** - Scale down during low traffic
3. **Use CloudWatch alarms** - Monitor costs and usage
4. **Reserve instances** - For predictable EC2 workloads
5. **Clean up unused resources** - Regular audits

