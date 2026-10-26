import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
    DB_NAME: str = "gridwise"
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "supersecretkey")
    
    class Config:
        env_file = "../../.env" # Use root env if needed, or backend/.env

settings = Settings()
