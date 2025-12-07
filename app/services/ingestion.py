import httpx
import urllib.parse
from typing import List, Optional

from ..config.settings import settings

async def get_profiles(role_title: str, keywords: List[str], location_filter: Optional[str] = None, limit: int = 20) -> List[str]:
    bearer_token = settings.twitter_bearer_token
    use_mock = not bearer_token or bearer_token == "your_twitter_bearer_token_here"
    if use_mock:
        print("No token – Empty profiles (real only mode)")
        return []  # No mocks – Require token

    try:
        print("Direct Bearer v2 X API (standalone app)")
        headers = {"Authorization": f"Bearer {bearer_token}"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Tweets search
            query_terms = [role_title] + keywords
            query = " ".join(query_terms) + " -is:retweet lang:en"
            if location_filter:
                query_terms.append(location_filter)
                print(f"Geo approx '{location_filter}' keyword")

            max_results = max(10, min(limit, 500))
            query_enc = urllib.parse.quote(query)
            tweets_url = f"https://api.twitter.com/2/tweets/search/recent?query={query_enc}&max_results={max_results}&tweet.fields=author_id,created_at,public_metrics"
            tweets_resp = await client.get(tweets_url, headers=headers)
            print(f"Tweets endpoint status: {tweets_resp.status_code} – {tweets_url}")
            if tweets_resp.status_code != 200:
                print(f"Error body: {tweets_resp.text}")
                return []  # Real only
            tweets_resp.raise_for_status()
            tweets_data = tweets_resp.json()
            tweets = tweets_data.get("data", [])
            if not tweets:
                print("No tweets matching")
                return []

            author_ids = list(set(tweet["author_id"] for tweet in tweets))

            # Users
            profiles = []
            if author_ids:
                ids_str = ','.join(author_ids[:100])
                users_url = f"https://api.twitter.com/2/users?ids={ids_str}&user.fields=description,public_metrics,pinned_tweet_id,location,url,username,verified,created_at"
                users_resp = await client.get(users_url, headers=headers)
                print(f"Users status: {users_resp.status_code}")
                users_resp.raise_for_status()
                users = users_resp.json().get("data", [])

                # Top 20 large scale
                users = sorted(users or [], key=lambda u: u.get('public_metrics', {}).get('followers_count', 0), reverse=True)[:20]
                for user in users:
                    profile_parts = [
                        f"@{user['username']}",
                        user.get('description', 'No bio'),
                        f"Location: {user.get('location', 'N/A')}",
                        f"Followers: {user.get('public_metrics', {}).get('followers_count', 0)}",
                        f"Verified: {user.get('verified', False)}",
                        f"Joined: {user.get('created_at', 'N/A')}",
                        f"URL: {user.get('url', 'N/A')}"
                    ]
                    profile_text = ". ".join(p for p in profile_parts if p)

                    # Pinned & tweets enrich
                    pinned_id = user.get('pinned_tweet_id')
                    if pinned_id:
                        pinned_url = f"https://api.twitter.com/2/tweets?ids={pinned_id}&tweet.fields=text,public_metrics"
                        pinned_resp = await client.get(pinned_url, headers=headers)
                        if pinned_resp.status_code == 200:
                            pinned = pinned_resp.json().get("data", [{}])[0]
                            pinned_text = pinned.get('text', '')[:280]
                            likes = pinned.get('public_metrics', {}).get('like_count', 0)
                            profile_text += f". Pinned (likes {likes}): {pinned_text}..."

                    tweets_url = f"https://api.twitter.com/2/users/{user['id']}/tweets?max_results=10&tweet.fields=text,public_metrics,created_at&exclude=replies"
                    tweets_resp = await client.get(tweets_url, headers=headers)
                    if tweets_resp.status_code == 200:
                        tweets = tweets_resp.json().get("data", [])
                        tweet_summary = " ".join(t.get('text', '')[:100] for t in tweets[:5])[:500]
                        likes_total = sum(t.get('public_metrics', {}).get('like_count', 0) for t in tweets)
                        profile_text += f". Recent tweets (likes total {likes_total}): {tweet_summary}..."

                    profiles.append(profile_text)

                print(f"Large scale: {len(tweets)} tweets → {len(users)} users → {len(profiles)} enriched for Grok batch (1 LLM call)")

    except Exception as e:
        print(f"X API error: {e}")
        return []  # Real only

    return profiles  # Top 20 enriched (large but efficient)

