import aiosqlite
from ..config.settings import settings

DB_PATH = settings.database_path

async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS Search (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                role_title TEXT NOT NULL,
                keywords TEXT NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS Candidate (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                handle TEXT NOT NULL,
                match_score INTEGER NOT NULL,
                reasoning TEXT NOT NULL,
                search_id INTEGER NOT NULL,
                FOREIGN KEY (search_id) REFERENCES Search (id) ON DELETE CASCADE
            )
        ''')
        await db.commit()

async def get_db():
    async with aiosqlite.connect(DB_PATH) as db:
        yield db