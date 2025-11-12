# Veya API

FastAPI backend for the Veya mindfulness app.

## 🚀 Quick Start

### Local Development

1. **Prerequisites**
- Python 3.11+
- PostgreSQL database
   - Docker (optional, for containerized setup)

2. **Installation**
```bash
   # Create virtual environment
python3.11 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

   # Install dependencies
pip install -r requirements.txt

   # Set up environment variables
cp .env.example .env
# Edit .env with your database credentials
```

3. **Run with Docker Compose** (Recommended)
   ```bash
   docker-compose up -d
```

4. **Or run locally**
```bash
   # Create database
   createdb veya  # or use psql
   
   # Run the application
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## 📦 Deployment

### Quick Deployment Guide

See **[QUICK_START.md](./QUICK_START.md)** for a quick comparison and recommended deployment paths.

### Detailed Deployment Options

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Tech stack comparison and recommendations
- **[DEPLOYMENT_GUIDES.md](./DEPLOYMENT_GUIDES.md)** - Step-by-step deployment guides for:
  - AWS App Runner
  - AWS Lambda
  - Docker + EC2/DigitalOcean Droplet

### Supported Deployment Platforms

✅ **AWS App Runner** - Fully managed, auto-scaling  
✅ **AWS Lambda** - Serverless, pay-per-use  
✅ **Docker** - EC2, DigitalOcean, or any Docker host  

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password
- `POST /api/auth/firebase/register` - Register with Firebase ID token (creates user if doesn't exist)
- `POST /api/auth/firebase/login` - Login with Firebase ID token (requires existing user)
- `POST /api/auth/firebase` - Authenticate with Firebase ID token (unified: auto-creates user)
- `POST /api/auth/guest` - Create a guest user and get token
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info (requires authentication)

### Users
- `GET /api/users/me` - Get current user info with profile (requires authentication)
- `GET /api/users/me/profile` - Get user personalization profile (requires authentication)
- `POST /api/users/me/profile` - Create/update user profile (requires authentication)
- `GET /api/users/me/onboarding/status` - Check onboarding completion status (requires authentication)

### Onboarding
- `GET /api/onboarding/status` - Check onboarding status (alias for /api/users/me/onboarding/status)
- `POST /api/onboarding/screen` - Update current onboarding screen (save progress)

### Catalog
- `GET /api/catalog/sessions` - Get list of meditation sessions

### Progress
- `POST /api/progress/sync` - Sync progress data (requires authentication)

### Mood
- `POST /api/mood/log` - Log a mood entry (requires authentication)

## 📖 Documentation

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`
- **Login API**: See [LOGIN_API.md](./LOGIN_API.md) for email/password authentication
- **Quick Start Login**: See [QUICK_START_LOGIN.md](./QUICK_START_LOGIN.md) for quick reference
- **Onboarding API**: See [ONBOARDING_API.md](./ONBOARDING_API.md) for onboarding status checking

## 🏗️ Project Structure

```
veya-api/
├── app/
│   ├── api/routes/     # API route handlers
│   ├── core/           # Configuration and security
│   ├── db/             # Database setup
│   ├── models/         # SQLModel database models
│   ├── schemas/        # Pydantic schemas
│   └── main.py         # FastAPI application
├── Dockerfile          # Container image
├── docker-compose.yml  # Local development setup
└── requirements.txt    # Python dependencies
```

## 🔧 Configuration

Environment variables (set in `.env` or deployment platform):

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (default: `redis://localhost:6379/0`)
- `REDIS_ENABLED` - Enable/disable Redis (default: `true`)
- `JWT_SECRET_KEY` - Secret key for JWT tokens
- `JWT_ALGORITHM` - JWT algorithm (default: HS256)
- `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` - Token expiry (default: 10080)
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated or "*")
- `API_VERSION` - API version (default: v1)
- `API_PREFIX` - API prefix (default: /api)

## 🗄️ Database Migrations

This project uses **Alembic** for automatic database migrations. When you add or modify fields in your SQLModel models, Alembic automatically detects changes and generates migration scripts.

### Quick Start

1. **Add/modify fields in models** (e.g., `app/models/user.py`)
2. **Generate migration**:
   ```bash
   docker-compose exec api alembic revision --autogenerate -m "Description of changes"
   ```
3. **Apply migration**:
   ```bash
   docker-compose exec api alembic upgrade head
   ```

✅ **Done!** The database is now updated automatically.

### Documentation

- **[QUICK_START_MIGRATIONS.md](./QUICK_START_MIGRATIONS.md)** - Quick reference for migrations
- **[ALEMBIC_MIGRATIONS.md](./ALEMBIC_MIGRATIONS.md)** - Complete migration guide

### Common Commands

```bash
# Generate migration after model changes
docker-compose exec api alembic revision --autogenerate -m "Description"

# Apply all pending migrations
docker-compose exec api alembic upgrade head

# Check current database version
docker-compose exec api alembic current

# View migration history
docker-compose exec api alembic history

# Rollback last migration
docker-compose exec api alembic downgrade -1
```

## 🗄️ Services

The application uses:
- **PostgreSQL** - Primary database for user data, sessions, and mood entries
- **Redis** - Caching and message queue (optional, can be disabled)

### Redis Usage

Redis is used for:
- **Caching** - Cache frequently accessed data to improve performance
- **Message Queue** - Background task processing (future use)

See `app/utils/cache_example.py` for usage examples.

