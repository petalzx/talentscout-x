from pydantic_settings import BaseSettings
from typing import Optional
import os

class Settings(BaseSettings):
    xai_api_key: str
    twitter_bearer_token: Optional[str] = None
    twitter_user_access_token: Optional[str] = None  # /2/users/search OAuth2 user (PKCE flow)
    twitter_client_id: str  # OAuth2 PKCE Client ID (app settings OAuth 2.0 tab – Required for user token flow)
    twitter_client_secret: Optional[str] = None  # Client Secret (confidential client)
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