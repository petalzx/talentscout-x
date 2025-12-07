from typing import List, Optional
from datetime import datetime
from prisma import Prisma
from .twitter_service import TwitterService
from .grok_service import GrokService
from ..config.settings import settings
from ..models.schemas import ScoutRequest, CandidateResponse, DetailedCandidateResponse, TweetResponse, NotificationRequest, NotificationResponse

class TalentService:
    def __init__(self):
        self.twitter_service = TwitterService()
        self.grok_service = GrokService()
        self.prisma = Prisma()

    async def scout_talent(self, request: ScoutRequest) -> List[CandidateResponse]:
        """Main talent scouting function"""

        # 1. Search Twitter for users with enhanced query and pre-filtering
        print(f"Searching for candidates with keywords: {request.keywords}")
        users = await self.twitter_service.search_users(
            request.keywords,
            job_title=request.job_title,
            max_results=100
        )

        if not users:
            return []

        print(f"Found {len(users)} potential candidates")

        # 2. Get recent tweets for candidates (limit to first N)
        limited_users = users[:settings.MAX_CANDIDATES_PER_SEARCH]

        # Fetch detailed tweets for each user (for storing in DB)
        user_tweets_map = {}
        for user in limited_users:
            user.recent_tweet = await self.twitter_service.get_recent_tweet(user.id)
            # Also fetch detailed tweets for storing
            tweets = await self.twitter_service.get_recent_tweets_detailed(user.id, max_count=5)
            user_tweets_map[user.id] = tweets

        # 3. Create search session
        session = await self.prisma.searchsession.create({
            "jobTitle": request.job_title,
            "keywords": ",".join(request.keywords)
        })

        # 4. Score candidates with Grok (in parallel batches)
        print(f"Scoring {len(limited_users)} candidates in parallel...")
        scoring_results = await self.grok_service.score_candidates_batch(request.job_title, limited_users, batch_size=5)

        # 5. Save all candidates and results
        results = []
        for user, scoring_result in zip(limited_users, scoring_results):
            print(f"Saving candidate: {user.username} (score: {scoring_result.score})")

            # Set pipeline stage based on match score
            # >= 75%: Qualified (strong match)
            # < 75%: Discovered (needs review)
            initial_pipeline_stage = "Qualified" if scoring_result.score >= 75 else "Discovered"

            # Save candidate to database
            candidate = await self.prisma.candidate.upsert(
                where={"handle": user.username},
                data={
                    "create": {
                        "handle": user.username,
                        "twitterId": user.id,
                        "name": user.name,
                        "bio": user.description,
                        "followers": user.followers_count,
                        "following": user.following_count,
                        "avatar": user.profile_image_url,
                        "headerImage": user.profile_banner_url or None,
                        "recentTweet": user.recent_tweet,
                        "pipelineStage": initial_pipeline_stage
                    },
                    "update": {
                        "twitterId": user.id,
                        "name": user.name,
                        "bio": user.description,
                        "followers": user.followers_count,
                        "following": user.following_count,
                        "avatar": user.profile_image_url,
                        "headerImage": user.profile_banner_url or None,
                        "recentTweet": user.recent_tweet
                        # Don't update pipelineStage on update - preserve manual changes
                    }
                }
            )

            # Save tweets to database
            if user.id in user_tweets_map and user_tweets_map[user.id]:
                # Delete old tweets for this candidate first
                await self.prisma.tweet.delete_many(where={"candidateId": candidate.id})

                # Save new tweets
                for tweet in user_tweets_map[user.id]:
                    await self.prisma.tweet.create({
                        "tweetId": tweet["id"],
                        "content": tweet["content"],
                        "likes": tweet["likes"],
                        "retweets": tweet["retweets"],
                        "replies": tweet["replies"],
                        "createdAt": tweet["created_at"],
                        "candidateId": candidate.id
                    })

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
                following=self._format_number(candidate.following or 0),
                match=result["score"],
                tags=found_skills[:4] if found_skills else ["Developer"],
                recent_post=candidate.recentTweet or "No recent posts",
                roles=[request.job_title],
                pipeline_stage=candidate.pipelineStage
            ))

        return response_data

    async def get_all_candidates(self) -> List[CandidateResponse]:
        """Get all candidates from the database with their highest scores"""

        # Get all search results with candidates, ordered by score
        search_results = await self.prisma.searchresult.find_many(
            include={
                "candidate": True,
                "session": True
            },
            order=[{"score": "desc"}]
        )

        # Group by candidate to get their best score
        candidate_map = {}
        for result in search_results:
            candidate_id = result.candidate.id

            if candidate_id not in candidate_map or result.score > candidate_map[candidate_id]["score"]:
                candidate_map[candidate_id] = {
                    "candidate": result.candidate,
                    "score": result.score,
                    "reasoning": result.reasoning,
                    "job_title": result.session.jobTitle
                }

        # Format for response
        response_data = []
        for result in candidate_map.values():
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
                following=self._format_number(candidate.following or 0),
                match=result["score"],
                tags=found_skills[:4] if found_skills else ["Developer"],
                recent_post=candidate.recentTweet or "No recent posts",
                roles=[result["job_title"]],
                pipeline_stage=candidate.pipelineStage
            ))

        # Sort by score and return
        response_data.sort(key=lambda x: x.match, reverse=True)
        return response_data

    def _format_number(self, num: int) -> str:
        if num >= 1000000:
            return f"{num/1000000:.1f}M"
        elif num >= 1000:
            return f"{num/1000:.1f}K"
        else:
            return str(num)

    async def get_candidate_profile(self, candidate_id: int) -> Optional[DetailedCandidateResponse]:
        """Get detailed candidate profile with tweets and AI insights"""

        # Get candidate with their best search result and tweets from database
        candidate = await self.prisma.candidate.find_unique(
            where={"id": candidate_id},
            include={
                "searches": {
                    "include": {"session": True},
                    "order_by": [{"score": "desc"}],
                    "take": 1
                },
                "tweets": True  # Include tweets from database
            }
        )

        if not candidate or not candidate.searches:
            return None

        best_result = candidate.searches[0]

        # Use tweets from database (instant, no API call needed!)
        recent_posts = []
        if candidate.tweets:
            recent_posts = [TweetResponse(
                id=tweet.tweetId,
                content=tweet.content,
                likes=tweet.likes,
                retweets=tweet.retweets,
                replies=tweet.replies,
                created_at=tweet.createdAt
            ) for tweet in candidate.tweets]

        # Fallback to stored tweet if no tweets in database
        if not recent_posts and candidate.recentTweet and candidate.recentTweet != "No recent tweets":
            recent_posts.append(TweetResponse(
                id="1",
                content=candidate.recentTweet,
                likes=0,
                retweets=0,
                replies=0,
                created_at=datetime.now().isoformat()
            ))

        # Extract skills from bio
        bio_lower = candidate.bio.lower() if candidate.bio else ""
        common_skills = ["python", "javascript", "react", "node", "aws", "docker", "kubernetes", "typescript", "go", "rust", "vue", "angular", "postgresql", "mongodb"]
        found_skills = [skill.title() for skill in common_skills if skill in bio_lower]

        # Parse AI reasoning into insights
        insights = []
        if best_result.reasoning:
            # Split reasoning into bullet points if possible
            reasoning_text = best_result.reasoning
            # Simple heuristic: if it contains sentences, split them
            if ". " in reasoning_text:
                sentences = [s.strip() for s in reasoning_text.split(". ") if s.strip()]
                insights = sentences[:3]  # Take top 3 insights
            else:
                insights = [reasoning_text]

        # If no insights, provide default based on score
        if not insights:
            if best_result.score >= 70:
                insights = [
                    "Strong technical profile with relevant experience",
                    "Skills align well with job requirements",
                    "Active in technical community"
                ]
            elif best_result.score >= 50:
                insights = [
                    "Has relevant technical skills",
                    "Some experience indicators present"
                ]
            else:
                insights = ["Limited information available for assessment"]

        return DetailedCandidateResponse(
            id=str(candidate.id),
            name=candidate.name or candidate.handle,
            handle=f"@{candidate.handle}",
            avatar=candidate.avatar or "https://via.placeholder.com/100",
            bio=candidate.bio or "No bio available",
            followers=self._format_number(candidate.followers or 0),
            following=self._format_number(candidate.following or 0),
            match=best_result.score,
            tags=found_skills[:6] if found_skills else ["Developer"],
            roles=[best_result.session.jobTitle],
            location=None,  # Not currently stored
            website=None,   # Not currently stored
            header_image=candidate.headerImage,
            pipeline_stage=candidate.pipelineStage,
            insights=insights,
            recent_posts=recent_posts
        )

    async def update_pipeline_stage(self, candidate_id: int, pipeline_stage: Optional[str]) -> bool:
        """Update the pipeline stage for a candidate"""
        try:
            await self.prisma.candidate.update(
                where={"id": candidate_id},
                data={"pipelineStage": pipeline_stage}
            )
            return True
        except Exception as e:
            print(f"Error updating pipeline stage: {e}")
            return False

    async def create_notification(self, request: NotificationRequest) -> Optional[NotificationResponse]:
        """Create a notification for a candidate"""
        try:
            # Get candidate info
            candidate = await self.prisma.candidate.find_unique(
                where={"id": request.candidate_id}
            )

            if not candidate:
                return None

            # Create notification
            notification = await self.prisma.notification.create({
                "candidateId": request.candidate_id,
                "message": request.message,
                "eventType": request.event_type,
                "fromStage": request.from_stage,
                "toStage": request.to_stage,
                "isAIGenerated": request.is_ai_generated
            })

            return NotificationResponse(
                id=notification.id,
                candidate_id=notification.candidateId,
                candidate_name=candidate.name or candidate.handle,
                message=notification.message,
                event_type=notification.eventType,
                from_stage=notification.fromStage,
                to_stage=notification.toStage,
                is_ai_generated=notification.isAIGenerated,
                sent_at=notification.sentAt.isoformat()
            )

        except Exception as e:
            print(f"Error creating notification: {e}")
            return None

    async def get_candidate_notifications(self, candidate_id: int) -> List[NotificationResponse]:
        """Get all notifications for a candidate"""
        try:
            # Get candidate info
            candidate = await self.prisma.candidate.find_unique(
                where={"id": candidate_id}
            )

            if not candidate:
                return []

            # Get notifications
            notifications = await self.prisma.notification.find_many(
                where={"candidateId": candidate_id},
                order=[{"sentAt": "desc"}]
            )

            return [
                NotificationResponse(
                    id=n.id,
                    candidate_id=n.candidateId,
                    candidate_name=candidate.name or candidate.handle,
                    message=n.message,
                    event_type=n.eventType,
                    from_stage=n.fromStage,
                    to_stage=n.toStage,
                    is_ai_generated=n.isAIGenerated,
                    sent_at=n.sentAt.isoformat()
                )
                for n in notifications
            ]

        except Exception as e:
            print(f"Error getting notifications: {e}")
            return []