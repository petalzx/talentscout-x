import httpx
import urllib.parse
import os
from typing import List, Optional

from ..config.settings import settings

async def get_profiles(role_title: str, keywords: List[str], location_filter: Optional[str] = None, limit: int = 20) -> List[str]:
    bearer_token = settings.twitter_bearer_token
    use_mock = not bearer_token or bearer_token == "your_twitter_bearer_token_here"
    print(f"Token set: {bool(bearer_token and bearer_token != 'your_twitter_bearer_token_here')}")
    if not use_mock:
        print("Attempting real X API call...")
    else:
        print("Using mock (token invalid/missing)")
    
    profiles = []
    if use_mock:
        print("Warning: Using mock data due to missing TWITTER_BEARER_TOKEN")
        profiles = [
            "@dev_guru: Experienced Backend Engineer specializing in FastAPI and scalable systems. GitHub: github.com/devguru. Location: US. Followers: 5000. Verified: True. URL: https://blog.devguru.com",
            "@new_coder: Learning Python and web dev through #100DaysOfCode. Beginner projects on GitHub. Location: N/A. Followers: 100. Verified: False.",
            "@senior_dev: Lead Architect at TechCorp, expert in system design and Postgres optimization. Location: US. Followers: 10000. Verified: True. Pinned: Scaling microservices with Kubernetes."
        ]
    else:
        try:
            twitter_client = tweepy.Client(bearer_token=bearer_token)

            query_terms = [role_title] + keywords
            query = " ".join(query_terms) + " -is:retweet lang:en"
            if location_filter:
                # Basic tier limits geo operators; add as keyword for approx
                query_terms.append(location_filter)
                print(f"Note: Geo limited in free tier; added '{location_filter}' as keyword approx")

            max_results = min(request.limit or 20, 500)  # Twitter max; batch scale
            tweets_response = twitter_client.search_recent_tweets(
                query=query,
                max_results=max_results,
                tweet_fields=["author_id", "created_at", "public_metrics"]
            )
            if not tweets_response.data:
                return []

            author_ids = list(set(tweet.author_id for tweet in tweets_response.data))

            users_response = twitter_client.get_users(
                ids=author_ids[:100],
                user_fields=["description", "public_metrics", "pinned_tweet_id", "location", "url", "username", "verified", "created_at"]
            )
            users = users_response.data or []

            for user in users:
                profile_parts = [
                    f"@{user.username}",
                    user.description or "No bio",
                    f"Location: {user.location or 'N/A'}",
                    f"Followers: {user.public_metrics.get('followers_count', 0)}",
                    f"Verified: {user.verified}",
                    f"Joined: {user.created_at}",
                    f"URL: {user.url or 'N/A'}"
                ]
                profile_text = ". ".join(p for p in profile_parts if p and p != "No bio")

                if user.pinned_tweet_id:
                    try:
                        pinned_response = twitter_client.get_tweet(
                            id=user.pinned_tweet_id,
                            tweet_fields=["text"]
                        )
                        if pinned_response.data:
                            profile_text += f". Pinned Tweet: {pinned_response.data.text[:280]}..."
                    except:
                        pass
                
                if profile_text.strip():
                    profiles.append(profile_text)

        except Exception as e:
            print(f"Ingestion error: {e}")
            # Fallback mock
            profiles = ["@fallback_dev: Sample profile for demo."]

    return profiles  # Top 20 enriched (large scale)