# Veya API - Quick Start Deployment

## 🚀 Recommended Deployment Path

Based on your FastAPI application with PostgreSQL, here's the **recommended path**:

### For MVP / Quick Launch: **AWS App Runner**
- Fastest to deploy (15 minutes)
- Minimal configuration
- Automatic scaling
- Best for getting started quickly

### For Production / Cost Optimization: **Docker + DigitalOcean Droplet**
- Best cost/performance ratio ($12-30/month)
- Full control
- Predictable costs
- Easy to scale later

---

## 📋 Pre-Deployment Checklist

Before deploying, you need:

1. **Database**:
   - [ ] AWS RDS PostgreSQL (for AWS deployments)
   - [ ] OR DigitalOcean Managed Database
   - [ ] OR Self-hosted PostgreSQL

2. **Environment Variables**:
   ```
   DATABASE_URL=postgresql://user:pass@host:5432/veya
   JWT_SECRET_KEY=your-strong-secret-key-32-chars-min
   JWT_ALGORITHM=HS256
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=10080
   CORS_ORIGINS=https://your-frontend-domain.com,https://app.yourapp.com
   ```

3. **Domain (Optional)**:
   - For production, set up a domain name
   - Point DNS to your server/load balancer

---

## ⚡ Fastest Path: AWS App Runner (15 min)

1. **Create RDS Database** (5 min)
   - AWS Console → RDS → Create PostgreSQL
   - Note the endpoint

2. **Push to GitHub** (2 min)
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

3. **Create App Runner Service** (5 min)
   - AWS Console → App Runner → Create service
   - Connect GitHub repo
   - Add environment variables
   - Deploy!

4. **Update Mobile App** (3 min)
   - Use App Runner URL in your mobile app config

**Total Time: ~15 minutes**

See [DEPLOYMENT_GUIDES.md](./DEPLOYMENT_GUIDES.md#1-aws-app-runner-deployment) for detailed steps.

---

## 💰 Most Cost-Effective: DigitalOcean Droplet (30 min)

1. **Create Droplet** (5 min)
   - DigitalOcean → Create Droplet ($12/month)
   - Ubuntu 22.04, 2GB RAM

2. **Set up Server** (10 min)
   ```bash
   ssh root@your-droplet-ip
   curl -fsSL https://get.docker.com -o get-docker.sh && sh get-docker.sh
   apt install docker-compose-plugin -y
   ```

3. **Deploy Application** (10 min)
   ```bash
   git clone your-repo /opt/veya-api
   cd /opt/veya-api
   # Edit .env file with database URL
   docker-compose up -d
   ```

4. **Set up SSL** (5 min)
   ```bash
   apt install nginx certbot python3-certbot-nginx -y
   certbot --nginx -d your-domain.com
   ```

**Total Time: ~30 minutes**

See [DEPLOYMENT_GUIDES.md](./DEPLOYMENT_GUIDES.md#3-docker--ec2droplet-deployment) for detailed steps.

---

## 📊 Cost Comparison (Monthly)

| Service | Low Traffic | Medium Traffic | High Traffic |
|---------|------------|----------------|--------------|
| **App Runner** | $20-40 | $50-100 | $200+ |
| **Lambda** | $5-15 | $30-50 | $100+ |
| **Docker + Droplet** | $27 | $27 | $54 (2 droplets) |

*Low = < 10K requests/day, Medium = 10K-100K, High = 100K+*

---

## 🎯 Decision Matrix

Choose **AWS App Runner** if:
- ✅ You want fastest deployment
- ✅ You prefer managed services
- ✅ You want automatic scaling
- ✅ Budget allows $20-40/month

Choose **AWS Lambda** if:
- ✅ Traffic is very low/intermittent
- ✅ You want pay-per-use pricing
- ✅ You're okay with cold starts
- ✅ You need event-driven architecture

Choose **Docker + Droplet/EC2** if:
- ✅ You want lowest cost
- ✅ You want full control
- ✅ Traffic is predictable
- ✅ You're comfortable with server management

---

## 🔧 Files Created for You

1. **Dockerfile** - Container image for all deployments
2. **docker-compose.yml** - Local dev + production setup
3. **apprunner.yaml** - App Runner configuration
4. **lambda_handler.py** - Lambda adapter
5. **nginx.conf** - Reverse proxy config
6. **deploy-ec2.sh** - Deployment script
7. **requirements-lambda.txt** - Lambda dependencies

---

## 📚 Next Steps

1. Read [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed tech stack comparison
2. Follow [DEPLOYMENT_GUIDES.md](./DEPLOYMENT_GUIDES.md) for step-by-step instructions
3. Choose your deployment option
4. Deploy!
5. Update your mobile app with the API URL

---

## 🆘 Need Help?

- Check [DEPLOYMENT_GUIDES.md](./DEPLOYMENT_GUIDES.md#troubleshooting) for common issues
- Verify environment variables are set correctly
- Check database connectivity
- Review logs: `docker-compose logs` or CloudWatch

