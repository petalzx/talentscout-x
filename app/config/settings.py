from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    xai_api_key: str
    twitter_bearer_token: Optional[str] = None
    database_path: str = "dev.db"
    project_name: str = "TalentScout X"
    version: str = "0.1.0"
    xai_base_url: str = "https://api.x.ai/v1"
    xai_model: str = "grok-3"  # Updated from deprecated grok-beta

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()

# Legacy support for dotenv
if not settings.xai_api_key:
    settings.xai_api_key = os.getenv("XAI_API_KEY", "")

if not settings.twitter_bearer_token:
    settings.twitter_bearer_token = os.getenv("TWITTER_BEARER_TOKEN", "")