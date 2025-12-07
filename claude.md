# TalentScout X - Simplified AI Talent Discovery

## Overview
AI-powered talent discovery platform that searches X (Twitter) for candidates, analyzes them with Grok, and displays ranked results. Built with React frontend, FastAPI backend, and Prisma ORM.

## Architecture

```
Frontend (React) ←→ Backend (FastAPI) ←→ X API v2 + Grok AI
                           ↓
                    Prisma + SQLite
```

## Core Workflow
1. User enters job title + keywords
2. Search X API for users matching keywords
3. Get user profiles + recent tweets
4. Send batch to Grok for scoring (1-100)
5. Save to database via Prisma
6. Display top 10 results

## Simplified Ranking System
- Single score (1-100) from Grok AI
- No complex multi-factor analysis
- Grok considers: bio relevance, recent activity, follower count
- Simple prompt: "Rate this person 1-100 for [job title] based on their profile"

## Database Schema (Prisma Only)

```prisma
model Candidate {
  id        Int      @id @default(autoincrement())
  handle    String   @unique
  name      String?
  bio       String?
  followers Int?
  avatar    String?
  recentTweet String?
  createdAt DateTime @default(now())
  searches  SearchResult[]
}

model SearchSession {
  id        Int      @id @default(autoincrement())
  jobTitle  String
  keywords  String   // comma-separated
  createdAt DateTime @default(now())
  results   SearchResult[]
}

model SearchResult {
  id          Int           @id @default(autoincrement())
  score       Int           // 1-100 from Grok
  reasoning   String?       // optional explanation
  candidateId Int
  sessionId   Int
  candidate   Candidate     @relation(fields: [candidateId], references: [id])
  session     SearchSession @relation(fields: [sessionId], references: [id])
}
```

## Implementation Plan

### Backend (`/scout` endpoint)
```python
async def scout_talent(job_title: str, keywords: List[str]):
    # 1. Search X API
    users = await twitter_client.search_users(keywords, limit=1000)

    # 2. Get profiles + tweets
    profiles = await asyncio.gather(*[
        get_user_details(user.id) for user in users[:100]  # limit processing
    ])

    # 3. Score with Grok (simple prompt)
    prompt = f"Rate 1-100 how good this person is for {job_title}: {profile}"
    scores = await grok_client.batch_score(profiles, prompt)

    # 4. Save to database with Prisma
    session = await prisma.searchsession.create({
        'jobTitle': job_title,
        'keywords': ','.join(keywords)
    })

    for profile, score in zip(profiles, scores):
        candidate = await prisma.candidate.upsert({
            'where': {'handle': profile.handle},
            'create': profile_data,
            'update': profile_data
        })

        await prisma.searchresult.create({
            'score': score,
            'candidateId': candidate.id,
            'sessionId': session.id
        })

    # 5. Return top 10
    return await prisma.searchresult.find_many({
        'where': {'sessionId': session.id},
        'orderBy': {'score': 'desc'},
        'take': 10,
        'include': {'candidate': True}
    })
```

### Frontend Integration
- Connect to existing `CandidateFeed.tsx` component
- Replace mock data with API calls
- Map database results to frontend candidate format

## Environment Setup
```env
# X API
TWITTER_BEARER_TOKEN=your_token
TWITTER_CLIENT_ID=your_id
TWITTER_CLIENT_SECRET=your_secret

# Grok AI
XAI_API_KEY=your_key

# Database (Prisma handles this)
DATABASE_URL="file:dev.db"
```

## Efficiency Optimizations

### 1. Limit Search Scope
- Max 1000 initial user search
- Process only top 100 profiles
- Return top 10 results

### 2. Simple Parallel Processing
```python
# Concurrent API calls
async def process_candidates(candidates):
    tasks = [get_user_profile(c) for c in candidates]
    return await asyncio.gather(*tasks, return_exceptions=True)
```

### 3. Prisma Optimizations
- Use `upsert` to avoid duplicate candidates
- Include relations in single query
- Index on handle + score fields

### 4. Basic Caching
- Store candidates in database (natural caching)
- Reuse existing candidate data if recent
- No external cache needed

## Development Commands

```bash
# Setup
npm install prisma
prisma generate
prisma db push

# Run
uvicorn main:app --reload  # Backend
cd frontend && npm run dev  # Frontend
```

## Simplified Error Handling
- Try/catch on API calls
- Return partial results if some fail
- Log errors, don't crash
- Fallback to smaller candidate sets

## Key Simplifications Made

1. **Single Database Tool**: Only Prisma, no Redis/external cache
2. **Simple Scoring**: One number from Grok, no complex algorithms
3. **Limited Scale**: 100 candidates max, not thousands
4. **Basic Schema**: 3 simple tables, minimal relationships
5. **No Advanced Features**: No sentiment analysis, ML models, etc.
6. **SQLite**: Local file database, no PostgreSQL complexity

This approach gets the core functionality working quickly while keeping the codebase maintainable and the frontend design intact.