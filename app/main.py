from fastapi import FastAPI
from contextlib import asynccontextmanager

from .config.settings import settings
from .db.database import init_db
from .routers.scout import router as scout_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield

app = FastAPI(
    title=settings.project_name,
    description="MVP for sourcing talent from X using xAI Grok",
    version=settings.version,
    lifespan=lifespan
)

app.include_router(scout_router, prefix="/api/v1", tags=["scout"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
