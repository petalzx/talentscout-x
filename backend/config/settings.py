import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    TWITTER_BEARER_TOKEN = os.getenv("TWITTER_BEARER_TOKEN")
    XAI_API_KEY = os.getenv("XAI_API_KEY")
    DATABASE_URL = os.getenv("DATABASE_URL", "file:dev.db")

    # API Configuration
    XAI_BASE_URL = "https://api.x.ai/v1"
    TWITTER_BASE_URL = "https://api.twitter.com/2"

    # Rate limiting
    MAX_CANDIDATES_PER_SEARCH = 20
    MAX_TWEETS_PER_USER = 5

settings = Settings()