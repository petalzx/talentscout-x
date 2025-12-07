import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
    TWITTER_CLIENT_ID = os.getenv("TWITTER_CLIENT_ID")
    TWITTER_CLIENT_SECRET = os.getenv("TWITTER_CLIENT_SECRET")
    XAI_API_KEY = os.getenv("XAI_API_KEY")
    DATABASE_URL = os.getenv("DATABASE_URL", "file:dev.db")

    # API Configuration
    XAI_BASE_URL = "https://api.x.ai/v1"
    TWITTER_BASE_URL = "https://api.twitter.com/2"

    # OAuth Configuration
    TWITTER_OAUTH_CALLBACK_URL = os.getenv("TWITTER_OAUTH_CALLBACK_URL", "http://localhost:8000/auth/twitter/callback")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3001")

    # Rate limiting
    MAX_CANDIDATES_PER_SEARCH = 20
    MAX_TWEETS_PER_USER = 5

settings = Settings()