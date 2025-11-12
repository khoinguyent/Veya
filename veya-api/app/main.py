from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.db.database import init_db
from app.db.redis_client import get_redis_client, close_redis_client
from app.core.firebase import initialize_firebase
from app.api.routes import auth, catalog, progress, mood, user
from app.api.routes import library, journal, practice
import os


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    # Initialize database (skip in Lambda to avoid connection issues during cold start)
    if os.getenv("AWS_LAMBDA_FUNCTION_NAME") is None:
        init_db()
    
    # Initialize Redis connection
    if settings.redis_enabled:
        get_redis_client()
    
    # Initialize Firebase
    initialize_firebase()
    
    yield
    
    # Shutdown
    close_redis_client()

app = FastAPI(
    title="Veya API",
    description="Backend API for Veya mindfulness app",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=settings.api_prefix)
app.include_router(user.router, prefix=settings.api_prefix)
app.include_router(catalog.router, prefix=settings.api_prefix)
app.include_router(progress.router, prefix=settings.api_prefix)
app.include_router(mood.router, prefix=settings.api_prefix)
app.include_router(library.router, prefix=settings.api_prefix)
app.include_router(journal.router, prefix=settings.api_prefix)
app.include_router(practice.router, prefix=settings.api_prefix)

# Template routes
from app.api.routes import templates, admin_templates
app.include_router(templates.router, prefix=settings.api_prefix)
app.include_router(admin_templates.router, prefix=settings.api_prefix)

# Resource routes
try:
    from app.api.routes import resources
    app.include_router(resources.router, prefix=settings.api_prefix)
except ImportError:
    pass  # Resources module may not exist

# Onboarding routes
from app.api.routes import onboarding
app.include_router(onboarding.router, prefix=settings.api_prefix)


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "Welcome to Veya API", "version": settings.api_version}


@app.get("/health")
def health_check():
    """Health check endpoint."""
    from app.db.redis_client import get_redis_client
    
    health_status = {
        "status": "healthy",
        "database": "connected",
        "redis": "unknown"
    }
    
    # Check Redis connection
    redis_client = get_redis_client()
    if redis_client:
        try:
            redis_client.ping()
            health_status["redis"] = "connected"
        except Exception:
            health_status["redis"] = "disconnected"
    else:
        health_status["redis"] = "disabled"
    
    return health_status

