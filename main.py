import os
from contextlib import asynccontextmanager
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from prisma import Prisma
import httpx
from dotenv import load_dotenv

load_dotenv()

# Initialize clients
prisma = Prisma()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await prisma.connect()
    yield
    await prisma.disconnect()

app = FastAPI(title="TalentScout X API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScoutRequest(BaseModel):
    job_title: str
    keywords: List[str]
    location_filter: Optional[str] = None

class CandidateResponse(BaseModel):
    id: str
    name: str
    handle: str
    avatar: str
    bio: str
    followers: str
    following: str = "0"
    match: int
    tags: List[str]
    recent_post: str
    engagement: str = "0 replies · 0 likes"
    roles: List[str]

class TwitterClient:
    def __init__(self):
        self.bearer_token = os.getenv("TWITTER_BEARER_TOKEN")
        if not self.bearer_token:
            raise ValueError("TWITTER_BEARER_TOKEN not found in environment")

        self.headers = {
            "Authorization": f"Bearer {self.bearer_token}",
            "Content-Type": "application/json"
        }

    async def search_users(self, keywords: List[str], max_results: int = 100) -> List[dict]:
        try:
            # Create search query from keywords
            query = " OR ".join([f'"{keyword}"' for keyword in keywords])
            query += " -is:retweet lang:en"

            async with httpx.AsyncClient() as client:
                # Search for tweets and get users
                params = {
                    "query": query,
                    "max_results": min(max_results, 100),  # Twitter API limit
                    "expansions": "author_id",
                    "user.fields": "public_metrics,description,profile_image_url,name,username"
                }

                response = await client.get(
                    "https://api.twitter.com/2/tweets/search/recent",
                    headers=self.headers,
                    params=params
                )

                if response.status_code != 200:
                    print(f"Twitter API error: {response.status_code} - {response.text}")
                    return []

                data = response.json()

                if not data.get("data") or not data.get("includes", {}).get("users"):
                    return []

                # Extract unique users
                users_dict = {}
                for user in data["includes"]["users"]:
                    if user["username"] not in users_dict:
                        users_dict[user["username"]] = {
                            "id": user["id"],
                            "username": user["username"],
                            "name": user.get("name", user["username"]),
                            "description": user.get("description", ""),
                            "followers_count": user.get("public_metrics", {}).get("followers_count", 0),
                            "profile_image_url": user.get("profile_image_url", ""),
                        }

                return list(users_dict.values())

        except Exception as e:
            print(f"Twitter API error: {e}")
            return []

    async def get_recent_tweet(self, user_id: str) -> str:
        try:
            async with httpx.AsyncClient() as client:
                params = {
                    "max_results": 5,
                    "exclude": "retweets,replies"
                }

                response = await client.get(
                    f"https://api.twitter.com/2/users/{user_id}/tweets",
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

class GrokClient:
    def __init__(self):
        self.api_key = os.getenv("XAI_API_KEY")
        if not self.api_key:
            raise ValueError("XAI_API_KEY not found in environment")

        self.base_url = "https://api.x.ai/v1"

    async def score_candidate(self, job_title: str, user_profile: dict) -> dict:
        try:
            prompt = f"""Rate this person from 1-100 for the job "{job_title}".

Profile:
- Name: {user_profile['name']}
- Bio: {user_profile['description']}
- Followers: {user_profile['followers_count']}
- Recent tweet: {user_profile.get('recent_tweet', 'No recent tweets')}

Consider:
- How well their bio matches the job requirements
- Their professional experience indicators
- Their social media presence and engagement
- Their technical skills mentioned

Return ONLY a JSON object with:
{{"score": number_1_to_100, "reasoning": "brief_explanation"}}"""

            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "model": "grok-beta",
                        "messages": [{"role": "user", "content": prompt}],
                        "temperature": 0.3,
                        "max_tokens": 200
                    }
                )

                if response.status_code == 200:
                    result = response.json()
                    content = result["choices"][0]["message"]["content"]

                    # Try to parse JSON from response
                    import json
                    try:
                        parsed = json.loads(content)
                        return {
                            "score": min(100, max(1, int(parsed.get("score", 50)))),
                            "reasoning": parsed.get("reasoning", "No reasoning provided")
                        }
                    except:
                        # Fallback scoring
                        return {"score": 50, "reasoning": "Could not parse Grok response"}
                else:
                    print(f"Grok API error: {response.status_code} - {response.text}")
                    return {"score": 50, "reasoning": "API error"}

        except Exception as e:
            print(f"Grok scoring error: {e}")
            return {"score": 50, "reasoning": f"Error: {str(e)}"}

# Initialize clients
twitter_client = TwitterClient()
grok_client = GrokClient()

@app.post("/scout", response_model=List[CandidateResponse])
async def scout_talent(request: ScoutRequest):
    try:
        # 1. Search X API for users
        print(f"Searching for candidates with keywords: {request.keywords}")
        users = await twitter_client.search_users(request.keywords, max_results=100)

        if not users:
            raise HTTPException(status_code=404, detail="No candidates found")

        print(f"Found {len(users)} potential candidates")

        # 2. Get recent tweets for each user
        for user in users[:20]:  # Limit to first 20 to avoid rate limits
            user["recent_tweet"] = await twitter_client.get_recent_tweet(user["id"])

        # 3. Create search session
        session = await prisma.searchsession.create({
            "jobTitle": request.job_title,
            "keywords": ",".join(request.keywords)
        })

        # 4. Score candidates with Grok
        results = []
        for user in users[:20]:  # Process first 20
            print(f"Scoring candidate: {user['username']}")

            # Score with Grok
            scoring_result = await grok_client.score_candidate(request.job_title, user)

            # Save candidate to database
            candidate = await prisma.candidate.upsert(
                where={"handle": user["username"]},
                data={
                    "create": {
                        "handle": user["username"],
                        "name": user["name"],
                        "bio": user["description"],
                        "followers": user["followers_count"],
                        "avatar": user["profile_image_url"],
                        "recentTweet": user.get("recent_tweet", "")
                    },
                    "update": {
                        "name": user["name"],
                        "bio": user["description"],
                        "followers": user["followers_count"],
                        "avatar": user["profile_image_url"],
                        "recentTweet": user.get("recent_tweet", "")
                    }
                }
            )

            # Save search result
            await prisma.searchresult.create({
                "score": scoring_result["score"],
                "reasoning": scoring_result["reasoning"],
                "candidateId": candidate.id,
                "sessionId": session.id
            })

            results.append({
                "candidate": candidate,
                "score": scoring_result["score"],
                "reasoning": scoring_result["reasoning"]
            })

        # 5. Sort by score and return top 10
        results.sort(key=lambda x: x["score"], reverse=True)
        top_results = results[:10]

        # 6. Format for frontend
        response_data = []
        for result in top_results:
            candidate = result["candidate"]

            # Extract skills from bio
            bio_lower = candidate.bio.lower() if candidate.bio else ""
            common_skills = ["python", "javascript", "react", "node", "aws", "docker", "kubernetes", "typescript", "go", "rust"]
            found_skills = [skill for skill in common_skills if skill in bio_lower]

            response_data.append(CandidateResponse(
                id=str(candidate.id),
                name=candidate.name or candidate.handle,
                handle=f"@{candidate.handle}",
                avatar=candidate.avatar or "https://via.placeholder.com/100",
                bio=candidate.bio or "No bio available",
                followers=format_number(candidate.followers or 0),
                match=result["score"],
                tags=found_skills[:4] if found_skills else ["Developer"],
                recent_post=candidate.recentTweet or "No recent posts",
                roles=[request.job_title]
            ))

        return response_data

    except Exception as e:
        print(f"Scout endpoint error: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def format_number(num: int) -> str:
    if num >= 1000000:
        return f"{num/1000000:.1f}M"
    elif num >= 1000:
        return f"{num/1000:.1f}K"
    else:
        return str(num)

@app.get("/")
async def root():
    return {"message": "TalentScout X API is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)