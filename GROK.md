# TalentScout X Project Context for Grok CLI

## Overview
TalentScout X is an MVP iOS-first app for recruiters to source technical talent from X (Twitter). Core loop: Input role/keywords → Backend searches X discourse → xAI Grok analyzes profiles → Returns ranked JSON list of candidates with scores/reasoning. Built in <4h, zero-ops (local FastAPI + SQLite).

## Architecture
- **Frontend**: SwiftUI iOS app (thin layer: form input, loading state, candidate list with X deep links via SFSafariViewController). Code scaffold in README.md.
- **Backend**: Modular Python FastAPI (`app/main.py`):
  - **Routers**: `/api/v1/scout` (app/routers/scout.py).
  - **Services**: Ingestion (Tweepy X API v2 or mock profiles, app/services/ingestion.py); AI ranking (OpenAI SDK for xAI Grok-beta, strict JSON output, app/services/ai_service.py).
  - **DB**: Prisma ORM (schema.prisma SQLite; type-safe create/find, app/db/database.py).
  - **Config**: pydantic-settings (env validation, app/config/settings.py).
  - **Models**: Pydantic ScoutRequest/CandidateMatch (app/models/scout.py).
- **External**: X API (Bearer token optional); xAI Grok (key required).
- **Persistence**: Session cache (Search + linked Candidates).

## Key Flows
1. **Scout Request**: POST /api/v1/scout {role_title, keywords[], location_filter?} → Query X tweets → Hydrate user profiles (bio, pinned, metrics) → Feed to Grok prompt (system: recruiter persona, scoring rules 0-100) → Parse JSON candidates → Insert DB → Return ranked list.
2. **Fallbacks**: Mock profiles if no Twitter token; error handling returns [] or basic mock.
3. **Prompt Brain**: SYSTEM_PROMPT in ai_service.py (strict JSON {candidates: [{handle, match_score, reasoning}]}; rules for senior/junior signals).

## Run & Dev
- **Setup**: `python -m venv venv; source venv/bin/activate; pip install -e .[test]`
- **Server**: `python -m app.main` (localhost:8000; docs /api/v1/docs; reload enabled).
- **Test**: `pytest -v` (endpoint smoke test; coverage in CI).
- **DB**: Auto-init tables; view with sqlite3 dev.db.
- **Env**: .env (XAI_API_KEY required; TWITTER_BEARER_TOKEN optional).
- **Deploy**: Local zero-ops; Vercel/Render easy (gunicorn worker); Docker possible.
- **CI**: GitHub Actions (tests + coverage on push/PR).

## Files/Structure
```
app/
├── main.py (FastAPI app, routers include)
├── config/settings.py (env)
├── db/database.py (Prisma ORM connect)
├── models/scout.py (Pydantic I/O)
├── routers/scout.py (endpoint logic)
└── services/ {ingestion.py (X fetch), ai_service.py (Grok rank)}
frontend/ (React TS Vite app for visuals)
├── src/App.tsx (form, API call, list/chart)
├── package.json (recharts/axios)
tests/ test_scout.py (API test)
scripts/ populate.py (scale concurrent calls)
schema.prisma (Prisma DB schema)
pyproject.toml (deps, pytest config)
requirements.txt (core deps)
README.md (setup, iOS/React run)
```

## Scale & Frontend
- **Concurrent Users**: scripts/populate.py tests 100 async scout calls (local OK; 1000+ with Postgres via Prisma DATABASE_URL).
- **Visual Frontend**: React TS (/frontend; npm run dev) – Form → API → Ranked list + recharts bar chart (scores viz). .env.local VITE_API_URL=backend.
- **Prisma DB**: Type-safe ORM (SQLite local; scale to Postgres free tiers like Supabase).

## Best Practices & Extensibility
- **Modular**: Separation for tests/maintenance (add auth? new service?).
- **Typed/Validated**: Pydantic everywhere.
- **Async**: DB/API calls.
- **Error Resilient**: Fallbacks, try/except, commits in tx.
- **Hackathon Ready**: Runs immediately, spec-compliant, public repo https://github.com/petalzx/talentscout-x.
- **Next**: Docker, more tests (unit services), caching (Redis), advanced prompts, iOS full Xcode project, deploy.

Use this for context in Grok CLI sessions: project uses xAI Grok for talent ranking from Twitter profiles. Focus on backend modularity, iOS integration, or enhancements like real-time search.