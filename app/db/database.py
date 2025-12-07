from prisma import Prisma
from ..config.settings import settings

prisma = Prisma()

async def init_db():
    # Tables created via prisma db push; no manual SQL needed
    pass  # Prisma handles schema sync

async def get_prisma():
    await prisma.connect()
    yield prisma
    await prisma.disconnect()