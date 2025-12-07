from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from dotenv import load_dotenv
import os
import json
from contextlib import asynccontextmanager

# External services
import tweepy
from openai import OpenAI

import aiosqlite

# Load environment variables
load_dotenv()

DB_PATH = "dev.db"

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS "Search" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "role_title" VARCHAR(255) NOT NULL,
                "keywords" TEXT NOT NULL,
                "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS "Candidate" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "handle" VARCHAR(255) NOT NULL,
                "match_score" INTEGER NOT NULL,
                "reasoning" TEXT NOT NULL,
                "search_id" INTEGER NOT NULL,
                FOREIGN KEY ("search_id") REFERENCES "Search" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            )
        ''')
        await db.commit()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Init DB tables
    await init_db()
    yield
    # No shutdown needed for SQLite

app = FastAPI(
    title="TalentScout X",
    description="MVP for sourcing talent from X using xAI Grok",
    lifespan=lifespan
)

class ScoutRequest(BaseModel):
    role_title: str
    keywords: List[str]
    location_filter: Optional[str] = None

class CandidateMatch(BaseModel):
    handle: str
    match_score: int
    reasoning: str

SYSTEM_PROMPT = """You are a senior technical talent scout with deep expertise in software engineering roles.

Task: Analyze the provided list of X (Twitter) user profiles. Rank each one for suitability to the given job role based on their bio, location, followers, verification, links, and pinned tweet (if any).

Scoring Rules:
- 90-100: Exceptional match - Senior experience signals (e.g., "Senior", "Lead", GitHub links with production code, discussions of advanced topics like system design, optimization, architecture).
- 70-89: Good match - Mentions relevant technologies/keywords, some experience indicators.
- 50-69: Moderate match - Beginner or tangential relevance, learning signals (#100DaysOfCode, bootcamp).
- 0-49: Poor match - Off-topic, bots, spam, no tech relevance.

For each profile, provide a match_score (integer 0-100) and a 1-sentence reasoning explaining the score.

Include ALL provided profiles in the output, even low scores.

Output EXACTLY this JSON format, nothing else:
{{
  "candidates": [
    {{
      "handle": "@username",
      "match_score": 92,
      "reasoning": "Short explanation here."
    }}
  ]
}}"""

@app.post("/scout", response_model=List[CandidateMatch])
async def scout(request: ScoutRequest):
    """
    Scout for technical talent on X (Twitter) using keywords and role.
    Uses Twitter API for sourcing, xAI Grok for ranking, persists to SQLite.
    """
    try:
        keywords_str = ",".join(request.keywords)

        # 2. Ingestion: Search X API via Tweepy or mock
        bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        use_mock = not bearer_token or bearer_token == "your_twitter_bearer_token_here"
        
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

                # Build query
                query_terms = [request.role_title] + request.keywords
                query = " ".join(query_terms) + " -is:retweet lang:en"
                if request.location_filter == "US":
                    query += " place_country:US"

                # Search recent tweets
                tweets_response = twitter_client.search_recent_tweets(
                    query=query,
                    max_results=20,
                    tweet_fields=["author_id", "created_at"]
                )
                if not tweets_response.data:
                    profiles = []  # No relevant tweets
                else:
                    author_ids = list(set(tweet.author_id for tweet in tweets_response.data))

                    # Get user profiles
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
                        profile_text = ". ".join([p for p in profile_parts if p and p != "No bio"])  # Filter empty

                        # Fetch pinned tweet
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
                        
                        if profile_text.strip():  # Only add non-empty
                            profiles.append(profile_text)

            except Exception as twitter_error:
                print(f"Twitter API error: {twitter_error}")
                # Fallback to mock
                profiles = [
                    "@fallback_dev: Sample profile for demo. Match based on keywords."
                ]

        if not profiles:
            return []

        # 3. AI Intelligence: xAI Grok analysis
        xai_key = os.getenv("XAI_API_KEY")
        if not xai_key:
            raise ValueError("XAI_API_KEY must be set in .env")

        ai_client = OpenAI(
            api_key=xai_key,
            base_url="https://api.x.ai/v1"
        )

        user_prompt = f"""Job Role: {request.role_title}
Keywords to match: {', '.join(request.keywords)}
Location preference: {request.location_filter or 'Any'}

Profiles to evaluate (rank all):
"""
        for i, profile in enumerate(profiles[:10], 1):  # Limit to 10 for token efficiency
            user_prompt += f"\n{i}. {profile}"

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt}
        ]

        response = ai_client.chat.completions.create(
            model="grok-beta",  # Use grok-beta; change to grok-2-1212 if available
            messages=messages,
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=2000
        )

        ai_content = response.choices[0].message.content.strip()
        ai_json = json.loads(ai_content)
        candidates_data = ai_json.get("candidates", [])

        # Fallback if no candidates or parse error
        if not candidates_data:
            # Use mock
            candidates_data = [
                {"handle": "@fallback", "match_score": 50, "reasoning": "Mock due to API error or no data."}
            ]

        # 4. Persistence and Response
        candidates = []
        async with aiosqlite.connect(DB_PATH) as db:
            # Already created search above? Wait, move search create here too.
            # Note: search create was before ingestion, but to combine transaction.
            cursor = await db.execute(
                "INSERT INTO Search (role_title, keywords) VALUES (?, ?)",
                (request.role_title, keywords_str)
            )
            search_id = cursor.lastrowid

            for item in candidates_data:
                if isinstance(item, dict):
                    handle = item.get("handle", "").lstrip("@")
                    if handle:
                        match_score = int(item.get("match_score", 0))
                        reasoning = str(item.get("reasoning", ""))
                        await db.execute(
                            "INSERT INTO Candidate (handle, match_score, reasoning, search_id) VALUES (?, ?, ?, ?)",
                            (handle, match_score, reasoning, search_id)
                        )
                        candidates.append(
                            CandidateMatch(
                                handle=f"@{handle}",
                                match_score=match_score,
                                reasoning=reasoning
                            )
                        )
            await db.commit()

        return candidates

    except json.JSONDecodeError:
        # Handle AI output not JSON
        print("AI output not valid JSON")
        return []
    except Exception as e:
        print(f"Error in scout: {str(e)}")
        # Return empty list or mock for demo
        return []

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)