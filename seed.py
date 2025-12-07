import asyncio
from prisma import Prisma
from backend.services.talent_service import TalentService
from backend.models.schemas import ScoutRequest

async def seed_database():
    """Seed the database with sample talent searches"""

    print("🌱 Starting database seeding...")

    # Sample job searches to populate the database
    sample_searches = [
        ScoutRequest(
            job_title="Senior Frontend Engineer",
            keywords=["React", "TypeScript", "JavaScript", "Frontend"]
        ),
        ScoutRequest(
            job_title="Backend Engineer",
            keywords=["Python", "API", "Database", "Backend"]
        ),
        ScoutRequest(
            job_title="ML Engineer",
            keywords=["Machine Learning", "AI", "TensorFlow", "PyTorch"]
        ),
        ScoutRequest(
            job_title="DevOps Engineer",
            keywords=["Docker", "Kubernetes", "AWS", "DevOps"]
        )
    ]

    talent_service = TalentService()
    await talent_service.prisma.connect()

    try:
        for i, search in enumerate(sample_searches, 1):
            print(f"\n📍 Running search {i}/{len(sample_searches)}: {search.job_title}")
            print(f"   Keywords: {', '.join(search.keywords)}")

            # Run the talent search
            results = await talent_service.scout_talent(search)

            print(f"   ✅ Found {len(results)} candidates")

            # Add delay to avoid rate limiting
            if i < len(sample_searches):
                print("   ⏳ Waiting 10 seconds before next search...")
                await asyncio.sleep(10)

    except Exception as e:
        print(f"❌ Error during seeding: {e}")
    finally:
        await talent_service.prisma.disconnect()

    print(f"\n🎉 Database seeding completed!")
    print("   You can now query the database for candidates and search results.")

async def show_database_stats():
    """Show statistics about the seeded data"""

    prisma = Prisma()
    await prisma.connect()

    try:
        # Get counts
        candidate_count = await prisma.candidate.count()
        session_count = await prisma.searchsession.count()
        result_count = await prisma.searchresult.count()

        print(f"\n📊 Database Statistics:")
        print(f"   - Candidates: {candidate_count}")
        print(f"   - Search Sessions: {session_count}")
        print(f"   - Search Results: {result_count}")

        # Show top candidates
        if result_count > 0:
            top_results = await prisma.searchresult.find_many(
                take=5,
                order=[{"score": "desc"}],
                include={"candidate": True, "session": True}
            )

            print(f"\n🏆 Top 5 Candidates:")
            for result in top_results:
                print(f"   - {result.candidate.name} (@{result.candidate.handle})")
                print(f"     Score: {result.score}% for {result.session.jobTitle}")
                print(f"     Bio: {result.candidate.bio[:100]}...")
                print()

    except Exception as e:
        print(f"❌ Error getting stats: {e}")
    finally:
        await prisma.disconnect()

if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "stats":
        asyncio.run(show_database_stats())
    else:
        asyncio.run(seed_database())
        asyncio.run(show_database_stats())