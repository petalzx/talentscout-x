from typing import List
from prisma import Prisma
from .twitter_service import TwitterService
from .grok_service import GrokService
from ..config.settings import settings
from ..models.schemas import ScoutRequest, CandidateResponse

class TalentService:
    def __init__(self):
        self.twitter_service = TwitterService()
        self.grok_service = GrokService()
        self.prisma = Prisma()

    async def scout_talent(self, request: ScoutRequest) -> List[CandidateResponse]:
        """Main talent scouting function"""

        # 1. Search Twitter for users
        print(f"Searching for candidates with keywords: {request.keywords}")
        users = await self.twitter_service.search_users(
            request.keywords,
            max_results=100
        )

        if not users:
            return []

        print(f"Found {len(users)} potential candidates")

        # 2. Get recent tweets for candidates (limit to first N)
        limited_users = users[:settings.MAX_CANDIDATES_PER_SEARCH]
        for user in limited_users:
            user.recent_tweet = await self.twitter_service.get_recent_tweet(user.id)

        # 3. Create search session
        session = await self.prisma.searchsession.create({
            "jobTitle": request.job_title,
            "keywords": ",".join(request.keywords)
        })

        # 4. Score candidates with Grok
        results = []
        for user in limited_users:
            print(f"Scoring candidate: {user.username}")

            # Score with Grok
            scoring_result = await self.grok_service.score_candidate(request.job_title, user)

            # Save candidate to database
            candidate = await self.prisma.candidate.upsert(
                where={"handle": user.username},
                data={
                    "create": {
                        "handle": user.username,
                        "name": user.name,
                        "bio": user.description,
                        "followers": user.followers_count,
                        "avatar": user.profile_image_url,
                        "recentTweet": user.recent_tweet
                    },
                    "update": {
                        "name": user.name,
                        "bio": user.description,
                        "followers": user.followers_count,
                        "avatar": user.profile_image_url,
                        "recentTweet": user.recent_tweet
                    }
                }
            )

            # Save search result
            await self.prisma.searchresult.create({
                "score": scoring_result.score,
                "reasoning": scoring_result.reasoning,
                "candidateId": candidate.id,
                "sessionId": session.id
            })

            results.append({
                "candidate": candidate,
                "score": scoring_result.score,
                "reasoning": scoring_result.reasoning
            })

        # 5. Sort by score and return top 10
        results.sort(key=lambda x: x["score"], reverse=True)
        top_results = results[:10]

        # 6. Format for response
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
                followers=self._format_number(candidate.followers or 0),
                match=result["score"],
                tags=found_skills[:4] if found_skills else ["Developer"],
                recent_post=candidate.recentTweet or "No recent posts",
                roles=[request.job_title]
            ))

        return response_data

    def _format_number(self, num: int) -> str:
        if num >= 1000000:
            return f"{num/1000000:.1f}M"
        elif num >= 1000:
            return f"{num/1000:.1f}K"
        else:
            return str(num)