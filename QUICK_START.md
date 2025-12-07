# Quick Start: Messaging & Events

## ✨ What's New

You now have a **fully functional messaging system** with:
- ✅ Real database-backed conversations
- ✅ 30% chance of simulated candidate responses
- ✅ 5 user personas (recruiters, managers, CTO)
- ✅ Event/interview scheduling
- ✅ All data persists across sessions

## 🎮 Try It Now

### Send a Message & Get a Response

```bash
# Method 1: Use the test file
curl -X POST http://localhost:8000/messages \
  -H "Content-Type: application/json" \
  -d @test_message.json

# Method 2: Create your own
cat > my_message.json << 'EOF'
{
  "candidate_id": 10,
  "content": "Saw your React work - impressive! Want to chat?",
  "sender_id": "recruiter-1",
  "sender_type": "recruiter",
  "message_type": "text"
}
EOF

curl -X POST http://localhost:8000/messages \
  -H "Content-Type: application/json" \
  -d @my_message.json
```

### Check for Responses

```bash
# View the conversation (might see a candidate response!)
curl http://localhost:8000/candidates/10/messages | python -m json.tool
```

### Schedule an Interview

```bash
cat > interview.json << 'EOF'
{
  "candidate_id": 10,
  "title": "Technical Interview",
  "event_type": "technical",
  "scheduled_at": "2025-12-11T14:00:00Z",
  "duration": 60,
  "meeting_type": "video",
  "meeting_link": "https://zoom.us/j/your-meeting",
  "notes": "Discuss React architecture and system design"
}
EOF

curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d @interview.json
```

## 👥 Use Different User Personas

```bash
# Message as Technical Recruiter
{
  "sender_id": "recruiter-2",
  "sender_type": "recruiter",
  ...
}

# Message as Engineering Manager
{
  "sender_id": "hiring-manager-1",
  "sender_type": "recruiter",
  ...
}

# Message as CTO
{
  "sender_id": "cto-1",
  "sender_type": "recruiter",
  ...
}
```

**Available Personas:**
- `recruiter-1` - Alex Rivera (You)
- `recruiter-2` - Sarah Chen
- `hiring-manager-1` - Michael Torres
- `hiring-manager-2` - Emily Watson
- `cto-1` - David Kim

## 📊 View All Data

```bash
# Get all messages for a candidate
curl http://localhost:8000/candidates/1/messages

# Get all scheduled events
curl http://localhost:8000/events

# Get events for specific candidate
curl http://localhost:8000/candidates/1/events
```

## 🔥 Pro Tips

1. **Higher Response Rate**: Send multiple messages to different candidates - about 30% will respond

2. **Realistic Conversations**: Use different personas for different stages:
   ```
   recruiter-1 → Initial outreach
   hiring-manager-1 → Technical questions
   cto-1 → Culture fit & vision
   ```

3. **Event Types**: Use these for `event_type`:
   - `phone_screen`
   - `technical`
   - `final`
   - `coffee_chat`
   - `team_fit`

4. **Meeting Types**:
   - `video`
   - `phone`
   - `in_person`

## 🎯 Example Workflow

```bash
# 1. Initial outreach (as recruiter)
curl -X POST http://localhost:8000/messages -H "Content-Type: application/json" -d '{
  "candidate_id": 15,
  "content": "Hi! Loved your work on the open-source project. Want to chat about a role?",
  "sender_id": "recruiter-1",
  "sender_type": "recruiter",
  "message_type": "text"
}'

# 2. Check if they responded
curl http://localhost:8000/candidates/15/messages | grep -A2 '"sender_type": "candidate"'

# 3. Schedule phone screen
curl -X POST http://localhost:8000/events -H "Content-Type: application/json" -d '{
  "candidate_id": 15,
  "title": "Phone Screen",
  "event_type": "phone_screen",
  "scheduled_at": "2025-12-09T10:00:00Z",
  "duration": 30,
  "meeting_type": "phone"
}'

# 4. Follow-up as engineering manager
curl -X POST http://localhost:8000/messages -H "Content-Type: application/json" -d '{
  "candidate_id": 15,
  "content": "Looking forward to our call tomorrow! Quick question - what's your experience with microservices?",
  "sender_id": "hiring-manager-1",
  "sender_type": "recruiter",
  "message_type": "text"
}'

# 5. View complete conversation history
curl http://localhost:8000/candidates/15/messages
```

## 🔧 Integration with Frontend

Add to your Messages component:

```typescript
// 1. Import personas
import { USER_PERSONAS, DEFAULT_USER } from './config/userPersonas';

// 2. Add state
const [currentUser, setCurrentUser] = useState(DEFAULT_USER);

// 3. Send messages via API
const sendMessage = async (content: string) => {
  const response = await axios.post('http://localhost:8000/messages', {
    candidate_id: selectedConversation.id,
    content: content,
    sender_id: currentUser.id,
    sender_type: 'recruiter',
    message_type: 'text'
  });

  // Refresh conversation after 1 second to get candidate response
  setTimeout(refreshMessages, 1000);
};

// 4. Load conversation history
const refreshMessages = async () => {
  const response = await axios.get(
    `http://localhost:8000/candidates/${candidateId}/messages`
  );
  setMessages(response.data);
};
```

## 📖 Full Documentation

- **MESSAGING_GUIDE.md** - Complete API documentation
- **IMPLEMENTATION_SUMMARY.md** - What's implemented & how to integrate
- **frontend/src/config/userPersonas.ts** - User persona definitions

## ✅ Backend Status

- ✅ Running on http://localhost:8000
- ✅ Database migrated with Message & Event tables
- ✅ All endpoints tested and working
- ✅ Auto-responses active (30% rate)

You're all set! Start sending messages and see candidates respond automatically!
