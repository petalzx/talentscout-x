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

    def _build_enhanced_query(self, keywords: List[str], job_title: str = "") -> str:
        """Build enhanced Twitter search query with role context"""

        # Technical keywords
        tech_keywords = " OR ".join([f'"{kw}"' for kw in keywords])

        # Role indicators - people who identify as developers/engineers
        role_indicators = '(developer OR engineer OR "software" OR programmer OR "tech lead" OR architect)'

        # Action words - people building/creating, not just mentioning
        action_words = '(building OR built OR "working on" OR developing OR created OR "shipped")'

        # Combine: find people who are developers AND mention the tech stack
        query = f'({tech_keywords}) ({role_indicators} OR {action_words}) -is:retweet lang:en'

        return query

    def _pre_filter_candidate(self, user: TwitterUser) -> bool:
        """Pre-filter candidates before expensive Grok scoring"""

        # Must have a bio
        if not user.description or len(user.description.strip()) < 10:
            return False

        bio_lower = user.description.lower()

        # Check for developer/engineer role indicators in bio
        role_keywords = [
            'developer', 'engineer', 'programmer', 'software',
            'frontend', 'backend', 'full stack', 'fullstack',
            'devops', 'sre', 'architect', 'tech lead', 'cto', 'ceo'
        ]

        has_role_indicator = any(keyword in bio_lower for keyword in role_keywords)

        # Check for technical keywords in bio
        tech_keywords = [
            'react', 'vue', 'angular', 'javascript', 'typescript', 'python',
            'java', 'golang', 'rust', 'node', 'aws', 'docker', 'kubernetes',
            'api', 'database', 'code', 'git', 'github', 'coding', 'programming'
        ]

        has_tech_keyword = any(keyword in bio_lower for keyword in tech_keywords)

        # Minimum follower threshold (at least some credibility)
        has_min_followers = user.followers_count >= 50

        # Bio should be somewhat substantial
        has_meaningful_bio = len(user.description) >= 20

        # Must have at least role indicator OR tech keyword
        # AND meet minimum followers and bio length requirements
        return (has_role_indicator or has_tech_keyword) and has_min_followers and has_meaningful_bio

    async def search_users(self, keywords: List[str], job_title: str = "", max_results: int = 100) -> List[TwitterUser]:
        try:
            # Build enhanced query
            query = self._build_enhanced_query(keywords, job_title)

            print(f"Enhanced Twitter query: {query}")

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

                # Parse users and apply pre-filtering
                users = []
                filtered_count = 0

                for user in data["includes"]["users"]:
                    twitter_user = TwitterUser(
                        id=user["id"],
                        username=user["username"],
                        name=user.get("name", user["username"]),
                        description=user.get("description", ""),
                        followers_count=user.get("public_metrics", {}).get("followers_count", 0),
                        profile_image_url=user.get("profile_image_url", ""),
                    )

                    # Apply pre-filtering
                    if self._pre_filter_candidate(twitter_user):
                        users.append(twitter_user)
                    else:
                        filtered_count += 1

                print(f"Found {len(users)} qualified candidates ({filtered_count} filtered out)")
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