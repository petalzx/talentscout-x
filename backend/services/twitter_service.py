import httpx
from typing import List
from ..config.settings import settings
from ..models.schemas import TwitterUser

class TwitterService:
    def __init__(self):
        if not settings.TWITTER_BEARER_TOKEN:
            raise ValueError("TWITTER_BEARER_TOKEN not found in environment")

        self.headers = {
            "Authorization": f"Bearer {settings.TWITTER_BEARER_TOKEN}",
            "Content-Type": "application/json"
        }

    async def search_users(self, keywords: List[str], max_results: int = 100) -> List[TwitterUser]:
        try:
            query = " OR ".join([f'"{keyword}"' for keyword in keywords])
            query += " -is:retweet lang:en"

            async with httpx.AsyncClient() as client:
                params = {
                    "query": query,
                    "max_results": min(max_results, 100),
                    "expansions": "author_id",
                    "user.fields": "public_metrics,description,profile_image_url,name,username"
                }

                response = await client.get(
                    f"{settings.TWITTER_BASE_URL}/tweets/search/recent",
                    headers=self.headers,
                    params=params
                )

                if response.status_code != 200:
                    print(f"Twitter API error: {response.status_code} - {response.text}")
                    return []

                data = response.json()

                if not data.get("data") or not data.get("includes", {}).get("users"):
                    return []

                users = []
                for user in data["includes"]["users"]:
                    users.append(TwitterUser(
                        id=user["id"],
                        username=user["username"],
                        name=user.get("name", user["username"]),
                        description=user.get("description", ""),
                        followers_count=user.get("public_metrics", {}).get("followers_count", 0),
                        profile_image_url=user.get("profile_image_url", ""),
                    ))

                return users

        except Exception as e:
            print(f"Twitter API error: {e}")
            return []

    async def get_recent_tweet(self, user_id: str) -> str:
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "max_results": settings.MAX_TWEETS_PER_USER,
                    "exclude": "retweets,replies"
                }

                response = await client.get(
                    f"{settings.TWITTER_BASE_URL}/users/{user_id}/tweets",
                    headers=self.headers,
                    params=params
                )

                if response.status_code != 200:
                    return "No recent tweets"

                data = response.json()
                if data.get("data") and len(data["data"]) > 0:
                    tweet_text = data["data"][0]["text"]
                    return tweet_text[:200] + "..." if len(tweet_text) > 200 else tweet_text

                return "No recent tweets"

        except Exception as e:
            print(f"Error getting tweets for user {user_id}: {e}")
            return "No recent tweets"