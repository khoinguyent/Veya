from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    # Database
    database_url: str = "postgresql://postgres:postgres@localhost:5432/veya"
    
    # Redis
    redis_url: str = "redis://localhost:6379/0"
    redis_enabled: bool = True  # Set to False to disable Redis
    
    # JWT
    jwt_secret_key: str = "your-secret-key-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    
    # API
    api_version: str = "v1"
    api_prefix: str = "/api"
    
    # CORS
    cors_origins: str = "*"  # Comma-separated list or "*" for all
    
    # Firebase
    firebase_credentials_path: Optional[str] = None  # Path to Firebase service account JSON
    firebase_project_id: Optional[str] = None
    firebase_emulator_host: Optional[str] = None  # For development: "localhost:9099"
    use_firebase_emulator: bool = False  # Set to True to use Firebase Emulator
    
    # Cloudflare R2
    r2_account_id: Optional[str] = None  # R2 Account ID
    r2_access_key_id: Optional[str] = None  # R2 Access Key ID
    r2_secret_access_key: Optional[str] = None  # R2 Secret Access Key
    r2_bucket_name: str = "veya-assets"  # R2 Bucket name
    r2_public_domain: Optional[str] = None  # Custom domain for R2 (e.g., "assets.veya.app")
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins from comma-separated string."""
        if self.cors_origins == "*":
            return ["*"]
        return [origin.strip() for origin in self.cors_origins.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()

