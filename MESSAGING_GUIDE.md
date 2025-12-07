# Messaging & Event Scheduling Guide

## Overview
This guide explains how to use the simulated back-and-forth messaging system and event scheduling features in TalentScout X.

## Features Implemented

### 1. **Multi-User Persona System**
You can switch between 5 different user accounts to simulate realistic team collaboration:

- **Alex Rivera** (You) - Senior Recruiter - Default account
- **Sarah Chen** - Technical Recruiter
- **Michael Torres** - Engineering Manager
- **Emily Watson** - Head of Product
- **David Kim** - CTO

Each user has their own:
- Unique avatar and name
- Role/title
- Color-coded messages
- Separate message history

### 2. **Real-Time Messaging**
- Send messages to candidates from any persona
- Messages are stored in the database
- **30% chance of simulated candidate response** when you send a message
- Conversation threading per candidate
- Message history persists across sessions

### 3. **Event Scheduling**
- Schedule phone screens, technical interviews, final rounds, etc.
- Set date, time, duration, and meeting type (video/phone)
- Events are saved to database with candidate association
- Calendar view of all upcoming events
- Meeting links and notes support

## How to Use

### Switching User Personas

1. **In the Messages page**, look for the user switcher dropdown (to be added in UI)
2. Click on a different user to switch perspectives
3. All messages you send will now appear as that user
4. The UI will color-code messages based on who sent them

**In the code (for frontend integration):**
```typescript
import { USER_PERSONAS, DEFAULT_USER, getUserColors } from './config/userPersonas';

// Get current user from localStorage or state
const currentUser = localStorage.getItem('current_user_id') || DEFAULT_USER.id;

// Switch user
const switchUser = (userId: string) => {
  localStorage.setItem('current_user_id', userId);
  // Refresh UI
};
```

### Sending Messages

**API Endpoint:** `POST /messages`

```typescript
const sendMessage = async (candidateId: number, content: string) => {
  const currentUserId = localStorage.getItem('current_user_id') || 'recruiter-1';

  const response = await axios.post('http://localhost:8000/messages', {
    candidate_id: candidateId,
    content: content,
    sender_id: currentUserId,
    sender_type: 'recruiter',
    message_type: 'text'
  });

  return response.data;
};
```

**Response:**
```json
{
  "id": 1,
  "candidate_id": 5,
  "content": "Hi! I'd love to discuss this role with you.",
  "sender_id": "recruiter-1",
  "sender_type": "recruiter",
  "message_type": "text",
  "metadata": null,
  "is_read": false,
  "created_at": "2025-12-07T12:34:56.789Z"
}
```

### Getting Conversation History

**API Endpoint:** `GET /candidates/{candidate_id}/messages`

```typescript
const getMessages = async (candidateId: number) => {
  const response = await axios.get(`http://localhost:8000/candidates/${candidateId}/messages`);
  return response.data; // Array of messages sorted by time
};
```

### Simulated Candidate Responses

The backend automatically simulates candidate responses with a **30% probability** when you send a message.

**Example responses:**
- "Thanks for reaching out! I'd love to learn more about this opportunity."
- "This sounds really interesting! When would be a good time to chat?"
- "I appreciate you thinking of me. Could you share more details about the role?"
- "I'm definitely interested! What are the next steps?"

To see this in action:
1. Send multiple messages to candidates
2. About 30% of the time, you'll get an instant response
3. Responses appear as `sender_type: "candidate"`

### Scheduling Events

**API Endpoint:** `POST /events`

```typescript
const scheduleEvent = async (candidateId: number, eventData: {
  title: string;
  event_type: string;
  scheduled_at: string; // ISO datetime
  duration: number; // minutes
  meeting_type: 'video' | 'phone';
  description?: string;
  meeting_link?: string;
  notes?: string;
}) => {
  const response = await axios.post('http://localhost:8000/events', {
    candidate_id: candidateId,
    ...eventData
  });

  return response.data;
};
```

**Example:**
```typescript
await scheduleEvent(5, {
  title: 'Technical Interview - Sarah Chen',
  event_type: 'technical',
  scheduled_at: '2025-12-10T14:00:00Z',
  duration: 60,
  meeting_type: 'video',
  meeting_link: 'https://zoom.us/j/123456789',
  notes: 'Focus on React and system design'
});
```

### Viewing Scheduled Events

**Get events for a candidate:**
```typescript
const response = await axios.get(`http://localhost:8000/candidates/${candidateId}/events`);
```

**Get all upcoming events:**
```typescript
const response = await axios.get('http://localhost:8000/events');
// Returns all scheduled events sorted by date
```

## Database Schema

### Message Table
```sql
Message {
  id: int (primary key)
  candidateId: int (foreign key)
  content: string
  senderId: string ("recruiter-1", "recruiter-2", etc.)
  senderType: string ("recruiter" or "candidate")
  messageType: string ("text", "meeting", "assessment")
  metadata: string? (JSON for extra data)
  isRead: boolean
  createdAt: datetime
}
```

### Event Table
```sql
Event {
  id: int (primary key)
  candidateId: int (foreign key)
  title: string
  description: string?
  eventType: string ("phone_screen", "technical", "final", etc.)
  scheduledAt: datetime
  duration: int (minutes)
  meetingType: string ("video", "phone", "in_person")
  status: string ("scheduled", "completed", "cancelled")
  meetingLink: string?
  notes: string?
  createdAt: datetime
}
```

## UI Integration Examples

### User Switcher Component
```tsx
import { USER_PERSONAS } from './config/userPersonas';

function UserSwitcher() {
  const [currentUser, setCurrentUser] = useState(DEFAULT_USER);

  const switchUser = (userId: string) => {
    const user = USER_PERSONAS.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('current_user_id', userId);
    }
  };

  return (
    <select onChange={(e) => switchUser(e.target.value)} value={currentUser.id}>
      {USER_PERSONAS.map(user => (
        <option key={user.id} value={user.id}>
          {user.name} - {user.role}
        </option>
      ))}
    </select>
  );
}
```

### Color-Coded Messages
```tsx
import { getUserColors } from './config/userPersonas';

function MessageBubble({ message }) {
  const isRecruiter = message.sender_type === 'recruiter';
  const colors = getUserColors(message.sender_id);

  return (
    <div className={`${isRecruiter ? colors.bg : 'bg-gray-800'} rounded-lg p-3`}>
      <p>{message.content}</p>
    </div>
  );
}
```

## Testing the Features

1. **Start the backend:**
   ```bash
   source venv/bin/activate
   python main.py
   ```

2. **Start the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Test messaging:**
   - Navigate to Messages page
   - Open a conversation with a candidate
   - Send several messages (about 30% will get responses)
   - Switch user personas and send more messages
   - Notice color-coded message bubbles

4. **Test event scheduling:**
   - Click "Schedule" button in a conversation
   - Fill in meeting details
   - Submit the event
   - View in calendar or events list

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/messages` | Send a message |
| GET | `/candidates/{id}/messages` | Get conversation history |
| POST | `/events` | Schedule an event |
| GET | `/candidates/{id}/events` | Get candidate's events |
| GET | `/events` | Get all upcoming events |

## Next Steps

### To enhance the system further:
1. **Add user switcher UI** to Messages page
2. **Display sender name** next to each message
3. **Add typing indicators** when candidate is "responding"
4. **Create calendar view** for scheduled events
5. **Add event reminders** (e.g., "Meeting in 30 minutes")
6. **Implement read receipts** for messages
7. **Add message search** functionality
8. **Create conversation filters** (by user, date, etc.)

## Example Workflow

Here's a complete example of using the multi-user messaging system:

```typescript
// 1. Switch to recruiter persona
switchUser('recruiter-1'); // Alex Rivera

// 2. Send initial outreach
await sendMessage(candidateId, "Hi! I came across your profile and was impressed...");

// 3. Candidate might respond (30% chance)
// Response appears automatically

// 4. Schedule phone screen
await scheduleEvent(candidateId, {
  title: 'Phone Screen',
  event_type: 'phone_screen',
  scheduled_at: '2025-12-08T10:00:00Z',
  duration: 30,
  meeting_type: 'phone'
});

// 5. Switch to engineering manager
switchUser('hiring-manager-1'); // Michael Torres

// 6. Send technical questions
await sendMessage(candidateId, "Looking forward to our call! Quick question about your React experience...");

// 7. View all messages in conversation
const messages = await getMessages(candidateId);
// See messages color-coded by sender
```

## Tips for Realistic Simulation

1. **Use different personas for different stages:**
   - Recruiter for initial outreach
   - Engineering Manager for technical discussions
   - CTO for final round

2. **Vary message content by role:**
   - Recruiters: Process, timeline, compensation
   - Engineers: Technical questions, architecture
   - Executives: Vision, culture, growth

3. **Schedule progressive interviews:**
   - Phone screen (30 min)
   - Technical round (60 min)
   - Team fit (45 min)
   - Final round (60 min)

This creates a realistic multi-stage hiring pipeline simulation!
