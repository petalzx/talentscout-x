from typing import List, Optional
from datetime import datetime
import json
from prisma import Prisma
from .twitter_service import TwitterService
from .grok_service import GrokService
from .calendar_service import CalendarService
from ..config.settings import settings
from ..models.schemas import (
    ScoutRequest, CandidateResponse, DetailedCandidateResponse,
    TweetResponse, NotificationRequest, NotificationResponse,
    SendMessageRequest, MessageResponse, CreateEventRequest, EventResponse
)

class TalentService:
    def __init__(self):
        self.twitter_service = TwitterService()
        self.grok_service = GrokService()
        self.calendar_service = CalendarService()
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

        if not candidate:
            return None

        # Handle candidates with and without search results (manually looked up vs. searched)
        has_search_results = candidate.searches and len(candidate.searches) > 0

        if has_search_results:
            best_result = candidate.searches[0]
            match_score = best_result.score
            job_title = best_result.session.jobTitle
            reasoning = best_result.reasoning
        else:
            # Manually looked up candidate - use defaults
            match_score = 50
            job_title = "Manual Lookup"
            reasoning = None

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
        if reasoning:
            # Split reasoning into bullet points if possible
            reasoning_text = reasoning
            # Simple heuristic: if it contains sentences, split them
            if ". " in reasoning_text:
                sentences = [s.strip() for s in reasoning_text.split(". ") if s.strip()]
                insights = sentences[:3]  # Take top 3 insights
            else:
                insights = [reasoning_text]

        # If no insights, provide default based on score or manual lookup
        if not insights:
            if not has_search_results:
                insights = [
                    "Manually added candidate",
                    "Profile retrieved from Twitter",
                    "Awaiting formal evaluation"
                ]
            elif match_score >= 70:
                insights = [
                    "Strong technical profile with relevant experience",
                    "Skills align well with job requirements",
                    "Active in technical community"
                ]
            elif match_score >= 50:
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
            match=match_score,
            tags=found_skills[:6] if found_skills else ["Developer"],
            roles=[job_title],
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

    async def lookup_and_add_user(self, username: str) -> Optional[CandidateResponse]:
        """Lookup a Twitter user by username and add to database"""
        try:
            # First check if user already exists in database
            clean_username = username.lstrip('@')
            existing = await self.prisma.candidate.find_first(
                where={"handle": clean_username}
            )

            if existing:
                print(f"User @{clean_username} already exists in database")
                # Return existing candidate
                bio_lower = existing.bio.lower() if existing.bio else ""
                common_skills = ["python", "javascript", "react", "node", "aws", "docker", "kubernetes", "typescript", "go", "rust"]
                found_skills = [skill for skill in common_skills if skill in bio_lower]

                # Get their best score from search results
                best_score = 50  # default
                best_role = "Developer"
                search_result = await self.prisma.searchresult.find_first(
                    where={"candidateId": existing.id},
                    include={"session": True},
                    order=[{"score": "desc"}]
                )
                if search_result:
                    best_score = search_result.score
                    best_role = search_result.session.jobTitle

                return CandidateResponse(
                    id=str(existing.id),
                    name=existing.name or existing.handle,
                    handle=f"@{existing.handle}",
                    avatar=existing.avatar or "https://via.placeholder.com/100",
                    bio=existing.bio or "No bio available",
                    followers=self._format_number(existing.followers or 0),
                    following=self._format_number(existing.following or 0),
                    match=best_score,
                    tags=found_skills[:4] if found_skills else ["Developer"],
                    recent_post=existing.recentTweet or "No recent posts",
                    roles=[best_role],
                    pipeline_stage=existing.pipelineStage
                )

            # Lookup user on Twitter
            twitter_user = await self.twitter_service.lookup_user_by_username(username)

            if not twitter_user:
                return None

            # Get recent tweet
            recent_tweet = await self.twitter_service.get_recent_tweet(twitter_user.id)

            # Add to database
            candidate = await self.prisma.candidate.upsert(
                where={"handle": twitter_user.username},
                data={
                    "create": {
                        "handle": twitter_user.username,
                        "twitterId": twitter_user.id,
                        "name": twitter_user.name,
                        "bio": twitter_user.description,
                        "followers": twitter_user.followers_count,
                        "following": twitter_user.following_count,
                        "avatar": twitter_user.profile_image_url,
                        "headerImage": twitter_user.profile_banner_url,
                        "recentTweet": recent_tweet
                    },
                    "update": {}
                }
            )

            # Extract skills
            bio_lower = twitter_user.description.lower() if twitter_user.description else ""
            common_skills = ["python", "javascript", "react", "node", "aws", "docker", "kubernetes", "typescript", "go", "rust"]
            found_skills = [skill for skill in common_skills if skill in bio_lower]

            return CandidateResponse(
                id=str(candidate.id),
                name=twitter_user.name or twitter_user.username,
                handle=f"@{twitter_user.username}",
                avatar=twitter_user.profile_image_url or "https://via.placeholder.com/100",
                bio=twitter_user.description or "No bio available",
                followers=self._format_number(twitter_user.followers_count),
                following=self._format_number(twitter_user.following_count),
                match=50,  # Default score for manually looked up users
                tags=found_skills[:4] if found_skills else ["Developer"],
                recent_post=recent_tweet,
                roles=["Manual Lookup"],
                pipeline_stage=candidate.pipelineStage
            )

        except Exception as e:
            print(f"Error in lookup_and_add_user: {e}")
            return None

    async def send_message(self, request):
        """Send a message in a conversation with a candidate"""
        import json
        import random

        try:
            # Save the message to database
            message = await self.prisma.message.create({
                "candidateId": request.candidate_id,
                "content": request.content,
                "senderId": request.sender_id,
                "senderType": request.sender_type,
                "messageType": request.message_type,
                "metadata": request.metadata,
                "isRead": False,
                "isInternal": request.is_internal
            })

            # Generate AI response (100% chance for demo - always respond in real-time)
            # Only generate AI responses for non-internal recruiter messages
            if request.sender_type == "recruiter" and not request.is_internal:
                # Get candidate info and conversation history
                candidate = await self.prisma.candidate.find_unique(
                    where={"id": request.candidate_id}
                )

                if candidate:
                    # Get recent message history
                    previous_messages = await self.prisma.message.find_many(
                        where={"candidateId": request.candidate_id},
                        order={"createdAt": "desc"},
                        take=10
                    )

                    # Generate contextual AI response
                    ai_response = await self._generate_candidate_response(
                        candidate=candidate,
                        recruiter_message=request.content,
                        conversation_history=previous_messages
                    )

                    if ai_response:
                        # Save AI-generated response
                        await self.prisma.message.create({
                            "candidateId": request.candidate_id,
                            "content": ai_response,
                            "senderId": str(request.candidate_id),
                            "senderType": "candidate",
                            "messageType": "text",
                            "metadata": json.dumps({"ai_generated": True}),
                            "isRead": False
                        })

                        print(f"✓ AI response generated for {candidate.name}")

            return {
                "id": message.id,
                "candidate_id": message.candidateId,
                "content": message.content,
                "sender_id": message.senderId,
                "sender_type": message.senderType,
                "message_type": message.messageType,
                "metadata": message.metadata,
                "is_read": message.isRead,
                "is_internal": message.isInternal,
                "created_at": message.createdAt.isoformat()
            }

        except Exception as e:
            print(f"Error sending message: {e}")
            return None

    async def _generate_candidate_response(self, candidate, recruiter_message: str, conversation_history) -> str:
        """Generate a realistic AI response from a candidate"""
        import random

        try:
            # Build conversation context
            conversation_context = ""
            if conversation_history:
                for msg in reversed(list(conversation_history)[-5:]):  # Last 5 messages
                    sender = "Recruiter" if msg.senderType == "recruiter" else candidate.name
                    conversation_context += f"{sender}: {msg.content}\n"

            # Determine response type based on message content
            message_lower = recruiter_message.lower()

            # Check for specific scenarios
            is_initial_outreach = len(conversation_history) <= 1
            is_scheduling = any(word in message_lower for word in ["schedule", "time", "available", "call", "meeting", "interview"])
            is_technical = any(word in message_lower for word in ["experience", "skills", "tech", "project", "work on"])
            is_compensation = any(word in message_lower for word in ["salary", "compensation", "pay", "benefits"])
            is_next_steps = any(word in message_lower for word in ["next steps", "process", "timeline"])

            # Create a prompt for Grok
            prompt = f"""You are {candidate.name}, a {candidate.bio[:100] if candidate.bio else 'software engineer'}.

A recruiter just messaged you: "{recruiter_message}"

Recent conversation:
{conversation_context}

Generate a realistic, professional response (2-4 sentences max). Be:
- Professional but friendly
- Interested and engaged
- Specific about your background when relevant
- Natural and conversational

Response type: {"Initial interest" if is_initial_outreach else "Follow-up"}
Context: {"Scheduling" if is_scheduling else "Technical discussion" if is_technical else "Compensation" if is_compensation else "Next steps" if is_next_steps else "General"}

Your response:"""

            # Use Grok to generate response
            response = await self.grok_service._make_grok_request(
                prompt=prompt,
                temperature=0.8,  # Higher for more variety
                max_tokens=200
            )

            if response:
                # Clean up the response
                cleaned_response = response.strip()
                # Remove quotes if Grok added them
                if cleaned_response.startswith('"') and cleaned_response.endswith('"'):
                    cleaned_response = cleaned_response[1:-1]
                return cleaned_response

        except Exception as e:
            print(f"Error generating AI response: {e}")

        # Fallback to template responses if AI fails
        fallback_responses = {
            "initial": [
                "Thanks for reaching out! I'd love to learn more about this opportunity.",
                "This sounds interesting! Could you share more details about the role?",
                "I appreciate you thinking of me. I'm currently exploring new opportunities."
            ],
            "scheduling": [
                "I'm available next week. What times work best for you?",
                "Yes, I'd be happy to schedule a call. I'm flexible this week.",
                "That works for me! Should I expect a calendar invite?"
            ],
            "technical": [
                f"I've been working with {candidate.bio[:50] if candidate.bio else 'various technologies'} recently. Happy to discuss my experience!",
                "Yes, I have experience in that area. I'd love to dive deeper in a conversation.",
                "That's definitely a strength of mine. When can we discuss this further?"
            ],
            "next_steps": [
                "What does the interview process look like?",
                "I'm excited to move forward. What are the next steps?",
                "Sounds good! What should I expect timeline-wise?"
            ],
            "general": [
                "Thanks for the update! Let me know how I can help.",
                "Sounds great! I'm looking forward to learning more.",
                "I appreciate the information. Happy to continue the conversation."
            ]
        }

        # Choose appropriate fallback
        if is_initial_outreach:
            return random.choice(fallback_responses["initial"])
        elif is_scheduling:
            return random.choice(fallback_responses["scheduling"])
        elif is_technical:
            return random.choice(fallback_responses["technical"])
        elif is_next_steps:
            return random.choice(fallback_responses["next_steps"])
        else:
            return random.choice(fallback_responses["general"])

    async def get_candidate_messages(self, candidate_id: int):
        """Get all messages for a specific candidate"""
        try:
            messages = await self.prisma.message.find_many(
                where={"candidateId": candidate_id},
                order={"createdAt": "asc"}
            )

            return [
                {
                    "id": msg.id,
                    "candidate_id": msg.candidateId,
                    "content": msg.content,
                    "sender_id": msg.senderId,
                    "sender_type": msg.senderType,
                    "message_type": msg.messageType,
                    "metadata": msg.metadata,
                    "is_read": msg.isRead,
                    "is_internal": msg.isInternal,
                    "created_at": msg.createdAt.isoformat()
                }
                for msg in messages
            ]

        except Exception as e:
            print(f"Error getting messages: {e}")
            return []

    async def create_event(self, request):
        """Create a calendar event/meeting with a candidate and send calendar invite"""
        from datetime import datetime
        import json

        try:
            # Parse the scheduled_at datetime
            scheduled_at = datetime.fromisoformat(request.scheduled_at.replace('Z', '+00:00'))

            # Get candidate info for the invite
            candidate = await self.prisma.candidate.find_unique(
                where={"id": request.candidate_id}
            )

            if not candidate:
                print(f"Candidate {request.candidate_id} not found")
                return None

            # Get interviewer info if assigned
            interviewer_name = None
            interviewer_role = None
            if request.assigned_interviewer_id:
                from ..config.userPersonas import USER_PERSONAS
                interviewer = next((p for p in USER_PERSONAS if p['id'] == request.assigned_interviewer_id), None)
                if interviewer:
                    interviewer_name = interviewer['name'].replace('You (', '').replace(')', '')
                    interviewer_role = interviewer['role']

            # Create the event in database
            event = await self.prisma.event.create({
                "candidateId": request.candidate_id,
                "title": request.title,
                "description": request.description,
                "eventType": request.event_type,
                "scheduledAt": scheduled_at,
                "duration": request.duration,
                "meetingType": request.meeting_type,
                "meetingLink": request.meeting_link,
                "notes": request.notes,
                "status": "scheduled",
                "assignedInterviewerId": request.assigned_interviewer_id,
                "assignedInterviewerName": interviewer_name,
                "assignedInterviewerRole": interviewer_role
            })

            # Generate calendar invite (.ics file content)
            calendar_invite = self.calendar_service.generate_ics(
                title=request.title,
                description=request.description or f"Interview for {candidate.name}",
                start_time=scheduled_at,
                duration_minutes=request.duration,
                organizer_email="recruiting@company.com",
                organizer_name="Recruiting Team",
                attendee_email=f"{candidate.handle.replace('@', '')}@example.com",  # Simulated email
                attendee_name=candidate.name,
                location=request.meeting_type.capitalize(),
                meeting_link=request.meeting_link
            )

            # Create a friendly message with meeting details
            event_date = scheduled_at.strftime('%B %d, %Y')
            event_time = scheduled_at.strftime('%I:%M %p')

            invite_message = self.calendar_service.create_calendar_message(
                candidate_name=candidate.name,
                event_title=request.title,
                event_date=event_date,
                event_time=event_time,
                duration=request.duration,
                meeting_type=request.meeting_type,
                meeting_link=request.meeting_link
            )

            # Send the calendar invite as a message
            await self.prisma.message.create({
                "candidateId": request.candidate_id,
                "content": invite_message,
                "senderId": "recruiter-1",  # System-generated
                "senderType": "recruiter",
                "messageType": "meeting",
                "metadata": json.dumps({
                    "event_id": event.id,
                    "calendar_invite": calendar_invite,
                    "meeting_link": request.meeting_link,
                    "scheduled_at": scheduled_at.isoformat(),
                    "duration": request.duration
                }),
                "isRead": False
            })

            print(f"✓ Calendar invite sent to {candidate.name} for {event_date} at {event_time}")

            return {
                "id": event.id,
                "candidate_id": event.candidateId,
                "title": event.title,
                "description": event.description,
                "event_type": event.eventType,
                "scheduled_at": event.scheduledAt.isoformat(),
                "duration": event.duration,
                "meeting_type": event.meetingType,
                "status": event.status,
                "meeting_link": event.meetingLink,
                "notes": event.notes,
                "assigned_interviewer_id": event.assignedInterviewerId,
                "assigned_interviewer_name": event.assignedInterviewerName,
                "assigned_interviewer_role": event.assignedInterviewerRole,
                "created_at": event.createdAt.isoformat(),
                "calendar_invite_sent": True
            }

        except Exception as e:
            print(f"Error creating event: {e}")
            import traceback
            traceback.print_exc()
            return None

    async def get_candidate_events(self, candidate_id: int):
        """Get all events for a specific candidate"""
        try:
            events = await self.prisma.event.find_many(
                where={"candidateId": candidate_id},
                order={"scheduledAt": "asc"}
            )

            return [
                {
                    "id": evt.id,
                    "candidate_id": evt.candidateId,
                    "title": evt.title,
                    "description": evt.description,
                    "event_type": evt.eventType,
                    "scheduled_at": evt.scheduledAt.isoformat(),
                    "duration": evt.duration,
                    "meeting_type": evt.meetingType,
                    "status": evt.status,
                    "meeting_link": evt.meetingLink,
                    "notes": evt.notes,
                    "assigned_interviewer_id": evt.assignedInterviewerId,
                    "assigned_interviewer_name": evt.assignedInterviewerName,
                    "assigned_interviewer_role": evt.assignedInterviewerRole,
                    "created_at": evt.createdAt.isoformat()
                }
                for evt in events
            ]

        except Exception as e:
            print(f"Error getting events: {e}")
            return []

    async def get_all_events(self):
        """Get all upcoming events across all candidates"""
        from datetime import datetime

        try:
            # Get events that are scheduled (not completed or cancelled)
            events = await self.prisma.event.find_many(
                where={
                    "status": "scheduled",
                    "scheduledAt": {"gte": datetime.now()}
                },
                order={"scheduledAt": "asc"},
                include={"candidate": True}
            )

            return [
                {
                    "id": evt.id,
                    "candidate_id": evt.candidateId,
                    "title": evt.title,
                    "description": evt.description,
                    "event_type": evt.eventType,
                    "scheduled_at": evt.scheduledAt.isoformat(),
                    "duration": evt.duration,
                    "meeting_type": evt.meetingType,
                    "status": evt.status,
                    "meeting_link": evt.meetingLink,
                    "notes": evt.notes,
                    "assigned_interviewer_id": evt.assignedInterviewerId,
                    "assigned_interviewer_name": evt.assignedInterviewerName,
                    "assigned_interviewer_role": evt.assignedInterviewerRole,
                    "created_at": evt.createdAt.isoformat()
                }
                for evt in events
            ]

        except Exception as e:
            print(f"Error getting all events: {e}")
            return []

    async def create_feedback(self, request):
        """Create interview feedback for a candidate"""
        try:
            feedback = await self.prisma.feedback.create({
                "candidateId": request.candidate_id,
                "interviewerId": request.interviewer_id,
                "interviewerName": request.interviewer_name,
                "interviewerRole": request.interviewer_role,
                "interviewerAvatar": request.interviewer_avatar,
                "stage": request.stage,
                "rating": request.rating,
                "recommendation": request.recommendation,
                "technicalSkills": request.technical_skills,
                "communication": request.communication,
                "cultureFit": request.culture_fit,
                "comments": request.comments,
                "strengths": json.dumps(request.strengths),
                "concerns": json.dumps(request.concerns)
            })

            return {
                "id": feedback.id,
                "candidate_id": feedback.candidateId,
                "interviewer_id": feedback.interviewerId,
                "interviewer_name": feedback.interviewerName,
                "interviewer_role": feedback.interviewerRole,
                "interviewer_avatar": feedback.interviewerAvatar,
                "stage": feedback.stage,
                "rating": feedback.rating,
                "recommendation": feedback.recommendation,
                "technical_skills": feedback.technicalSkills,
                "communication": feedback.communication,
                "culture_fit": feedback.cultureFit,
                "comments": feedback.comments,
                "strengths": json.loads(feedback.strengths),
                "concerns": json.loads(feedback.concerns),
                "created_at": feedback.createdAt.isoformat()
            }

        except Exception as e:
            print(f"Error creating feedback: {e}")
            return None

    async def get_candidates_with_feedback(self):
        """Get all candidates that have received feedback"""
        try:
            # Get all candidates with feedback
            candidates = await self.prisma.candidate.find_many(
                where={"feedback": {"some": {}}},
                include={"feedback": True, "searches": True}
            )

            result = []
            for candidate in candidates:
                if not candidate.feedback:
                    continue

                # Calculate average rating
                total_rating = sum(f.rating for f in candidate.feedback)
                avg_rating = total_rating / len(candidate.feedback) if candidate.feedback else 0

                # Get most common recommendation
                recommendations = {}
                for f in candidate.feedback:
                    recommendations[f.recommendation] = recommendations.get(f.recommendation, 0) + 1
                top_recommendation = max(recommendations.items(), key=lambda x: x[1])[0] if recommendations else "no"

                # Get role from search results
                role = "Unknown Role"
                if candidate.searches:
                    search_session = await self.prisma.searchsession.find_first(
                        where={"results": {"some": {"candidateId": candidate.id}}}
                    )
                    if search_session:
                        role = search_session.jobTitle

                # Get match score
                match_score = 50
                if candidate.searches:
                    match_score = candidate.searches[0].score if candidate.searches else 50

                result.append({
                    "id": str(candidate.id),
                    "name": candidate.name or "Unknown",
                    "handle": candidate.handle,
                    "avatar": candidate.avatar or "",
                    "role": role,
                    "match": match_score,
                    "stage": candidate.pipelineStage or "Qualified",
                    "feedback_count": len(candidate.feedback),
                    "avg_rating": round(avg_rating, 1),
                    "top_recommendation": top_recommendation
                })

            return result

        except Exception as e:
            print(f"Error getting candidates with feedback: {e}")
            return []

    async def get_candidate_feedback(self, candidate_id: int):
        """Get all feedback for a specific candidate"""
        try:
            feedback_list = await self.prisma.feedback.find_many(
                where={"candidateId": candidate_id},
                order={"createdAt": "desc"}
            )

            return [
                {
                    "id": f.id,
                    "candidate_id": f.candidateId,
                    "interviewer_id": f.interviewerId,
                    "interviewer_name": f.interviewerName,
                    "interviewer_role": f.interviewerRole,
                    "interviewer_avatar": f.interviewerAvatar,
                    "stage": f.stage,
                    "rating": f.rating,
                    "recommendation": f.recommendation,
                    "technical_skills": f.technicalSkills,
                    "communication": f.communication,
                    "culture_fit": f.cultureFit,
                    "comments": f.comments,
                    "strengths": json.loads(f.strengths),
                    "concerns": json.loads(f.concerns),
                    "created_at": f.createdAt.isoformat()
                }
                for f in feedback_list
            ]

        except Exception as e:
            print(f"Error getting candidate feedback: {e}")
            return []

    async def create_assessment(self, request):
        """Create an assessment for a candidate"""
        try:
            from datetime import datetime

            # Get candidate details
            candidate = await self.prisma.candidate.find_unique(
                where={"id": request.candidate_id},
                include={"searches": True}
            )

            if not candidate:
                return None

            # Get role from search results
            role = "Unknown Role"
            if candidate.searches:
                search_session = await self.prisma.searchsession.find_first(
                    where={"results": {"some": {"candidateId": candidate.id}}}
                )
                if search_session:
                    role = search_session.jobTitle

            completed_at = datetime.fromisoformat(request.completed_at.replace('Z', '+00:00'))

            assessment = await self.prisma.assessment.create({
                "candidateId": request.candidate_id,
                "title": request.title,
                "description": request.description,
                "assessmentType": request.assessment_type,
                "timeLimit": request.time_limit,
                "completedAt": completed_at
            })

            return {
                "id": assessment.id,
                "candidate_id": assessment.candidateId,
                "candidate_name": candidate.name or "Unknown",
                "candidate_avatar": candidate.avatar or "",
                "candidate_handle": candidate.handle,
                "candidate_role": role,
                "title": assessment.title,
                "description": assessment.description,
                "assessment_type": assessment.assessmentType,
                "time_limit": assessment.timeLimit,
                "status": assessment.status,
                "assigned_engineer_id": assessment.assignedEngineerId,
                "assigned_engineer_name": assessment.assignedEngineerName,
                "assigned_engineer_role": assessment.assignedEngineerRole,
                "assigned_engineer_avatar": assessment.assignedEngineerAvatar,
                "completed_at": assessment.completedAt.isoformat(),
                "created_at": assessment.createdAt.isoformat()
            }

        except Exception as e:
            print(f"Error creating assessment: {e}")
            return None

    async def get_assessments_awaiting_feedback(self):
        """Get all assessments that are awaiting feedback (pending or forwarded)"""
        try:
            assessments = await self.prisma.assessment.find_many(
                where={"status": {"in": ["pending", "forwarded"]}},
                include={"candidate": {"include": {"searches": True}}},
                order={"completedAt": "desc"}
            )

            result = []
            for assessment in assessments:
                candidate = assessment.candidate

                # Get role from search results
                role = "Unknown Role"
                if candidate.searches:
                    search_session = await self.prisma.searchsession.find_first(
                        where={"results": {"some": {"candidateId": candidate.id}}}
                    )
                    if search_session:
                        role = search_session.jobTitle

                result.append({
                    "id": assessment.id,
                    "candidate_id": assessment.candidateId,
                    "candidate_name": candidate.name or "Unknown",
                    "candidate_avatar": candidate.avatar or "",
                    "candidate_handle": candidate.handle,
                    "candidate_role": role,
                    "title": assessment.title,
                    "description": assessment.description,
                    "assessment_type": assessment.assessmentType,
                    "time_limit": assessment.timeLimit,
                    "status": assessment.status,
                    "assigned_engineer_id": assessment.assignedEngineerId,
                    "assigned_engineer_name": assessment.assignedEngineerName,
                    "assigned_engineer_role": assessment.assignedEngineerRole,
                    "assigned_engineer_avatar": assessment.assignedEngineerAvatar,
                    "completed_at": assessment.completedAt.isoformat(),
                    "created_at": assessment.createdAt.isoformat()
                })

            return result

        except Exception as e:
            print(f"Error getting assessments awaiting feedback: {e}")
            return []

    async def forward_assessment(self, request):
        """Forward an assessment to an engineer for review"""
        try:
            assessment = await self.prisma.assessment.update(
                where={"id": request.assessment_id},
                data={
                    "status": "forwarded",
                    "assignedEngineerId": request.engineer_id,
                    "assignedEngineerName": request.engineer_name,
                    "assignedEngineerRole": request.engineer_role,
                    "assignedEngineerAvatar": request.engineer_avatar
                }
            )

            return True if assessment else False

        except Exception as e:
            print(f"Error forwarding assessment: {e}")
            return False

    async def submit_feedback_as_message(self, request):
        """Submit interview feedback as an internal message and create a feedback record"""
        import json
        from ..config.userPersonas import USER_PERSONAS

        try:
            # Get interviewer info
            interviewer = next((p for p in USER_PERSONAS if p['id'] == request.interviewer_id), None)
            if not interviewer:
                print(f"Interviewer not found: {request.interviewer_id}")
                return None

            # Get candidate info
            candidate = await self.prisma.candidate.find_unique(
                where={"id": request.candidate_id}
            )

            if not candidate:
                print(f"Candidate not found: {request.candidate_id}")
                return None

            # Create feedback summary message
            recommendation_display = request.recommendation.replace('-', ' ').title()
            strengths_text = ', '.join(request.strengths) if request.strengths else 'None noted'
            concerns_text = ', '.join(request.concerns) if request.concerns else 'None noted'

            feedback_summary = f"""**Interview Feedback - {request.stage}**

**Rating:** {'⭐' * request.rating} ({request.rating}/5)
**Recommendation:** {recommendation_display}

**Skills Assessment:**
• Technical: {request.technical_skills}/5
• Communication: {request.communication}/5
• Culture Fit: {request.culture_fit}/5

**Comments:**
{request.comments}

**Strengths:** {strengths_text}
**Concerns:** {concerns_text}"""

            # Create metadata with feedback details
            metadata = json.dumps({
                "rating": request.rating,
                "recommendation": request.recommendation,
                "technical_skills": request.technical_skills,
                "communication": request.communication,
                "culture_fit": request.culture_fit,
                "strengths": request.strengths,
                "concerns": request.concerns,
                "stage": request.stage
            })

            # Save as internal message
            message = await self.prisma.message.create({
                "candidateId": request.candidate_id,
                "content": feedback_summary,
                "senderId": request.interviewer_id,
                "senderType": "internal",
                "messageType": "feedback",
                "metadata": metadata,
                "isRead": False,
                "isInternal": True
            })

            # Also create a formal feedback record
            await self.prisma.feedback.create({
                "candidateId": request.candidate_id,
                "interviewerId": request.interviewer_id,
                "interviewerName": interviewer['name'].replace('You (', '').replace(')', ''),
                "interviewerRole": interviewer['role'],
                "interviewerAvatar": interviewer['avatar'],
                "stage": request.stage,
                "rating": request.rating,
                "recommendation": request.recommendation,
                "technicalSkills": request.technical_skills,
                "communication": request.communication,
                "cultureFit": request.culture_fit,
                "comments": request.comments,
                "strengths": json.dumps(request.strengths),
                "concerns": json.dumps(request.concerns)
            })

            print(f"✓ Feedback submitted by {interviewer['name']} for {candidate.name}")

            return {
                "id": message.id,
                "candidate_id": message.candidateId,
                "content": message.content,
                "sender_id": message.senderId,
                "sender_type": message.senderType,
                "message_type": message.messageType,
                "metadata": message.metadata,
                "is_read": message.isRead,
                "is_internal": message.isInternal,
                "created_at": message.createdAt.isoformat()
            }

        except Exception as e:
            print(f"Error submitting feedback as message: {e}")
            return None