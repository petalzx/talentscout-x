# Messaging & Event Scheduling Implementation Summary

## ✅ What Has Been Implemented

### 1. **Database Schema** (Complete)
Added two new tables to handle messaging and event scheduling:

**Message Table:**
- Stores all messages between recruiters/team and candidates
- Tracks sender (recruiter personas like "recruiter-1", "hiring-manager-1", etc.)
- Supports different message types (text, meeting, assessment)
- Metadata field for rich message content
- Read receipts tracking

**Event Table:**
- Stores scheduled interviews and meetings
- Multiple event types (phone_screen, technical, final, etc.)
- Supports video, phone, and in-person meetings
- Duration, meeting links, and notes
- Event status tracking (scheduled, completed, cancelled)

### 2. **Backend API Endpoints** (Complete)

**Message Endpoints:**
- `POST /messages` - Send a message
- `GET /candidates/{id}/messages` - Get conversation history

**Event Endpoints:**
- `POST /events` - Create a scheduled event
- `GET /candidates/{id}/events` - Get candidate's events
- `GET /events` - Get all upcoming events

**Test Results:**
```bash
✅ Message creation: Working
✅ Simulated candidate responses: Working (30% response rate)
✅ Event scheduling: Working
✅ Multi-user personas: Working
```

### 3. **Simulated Candidate Auto-Responses** (Complete)
- **30% probability** that a candidate will respond when you send them a message
- 8 different realistic response templates
- Responses are saved to database automatically
- No frontend changes needed - happens server-side

**Example Responses:**
- "Thanks for reaching out! I'd love to learn more about this opportunity."
- "This sounds really interesting! When would be a good time to chat?"
- "I'm definitely interested! What are the next steps?"
- "Thanks! I'm currently exploring new opportunities. Let's schedule a call."

### 4. **Multi-User Persona System** (Complete)
Created configuration for 5 different user accounts:

1. **Alex Rivera** (recruiter-1) - Senior Recruiter - Blue theme
2. **Sarah Chen** (recruiter-2) - Technical Recruiter - Purple theme
3. **Michael Torres** (hiring-manager-1) - Engineering Manager - Green theme
4. **Emily Watson** (hiring-manager-2) - Head of Product - Pink theme
5. **David Kim** (cto-1) - CTO - Orange theme

**File:** `frontend/src/config/userPersonas.ts`

## 🧪 Tested Features

### Messages with Auto-Response
```bash
# Sent message to candidate 1
POST /messages
{
  "candidate_id": 1,
  "content": "Hi! Would you be interested in discussing a Senior Frontend role?",
  "sender_id": "recruiter-1"
}

# Got automatic candidate response:
{
  "id": 2,
  "content": "This aligns well with my career goals. I'd love to discuss further.",
  "sender_type": "candidate"
}
```

### Event Scheduling
```bash
# Created phone screen event
POST /events
{
  "candidate_id": 1,
  "title": "Phone Screen with Alex",
  "event_type": "phone_screen",
  "scheduled_at": "2025-12-10T10:00:00Z",
  "duration": 30
}

# Response: Event created with ID 1
```

### Multi-User Messaging
```bash
# Message from hiring manager
{
  "sender_id": "hiring-manager-1",
  "sender_type": "recruiter",
  "content": "Hi! Your backend experience looks great."
}

# Different sender persona successfully tracked
```

## 📋 What You Need to Do (Frontend Integration)

### Option 1: Quick Integration (Update Messages.tsx)

Replace the current message sending logic with:

```typescript
import { USER_PERSONAS, DEFAULT_USER } from './config/userPersonas';

// Add state for current user
const [currentUser, setCurrentUser] = useState(DEFAULT_USER);

// Update handleSendMessage function
const handleSendMessage = async () => {
  if (!messageText.trim() || !selectedConversation) return;

  try {
    const response = await axios.post(`${API_BASE}/messages`, {
      candidate_id: parseInt(selectedConversation.id),
      content: messageText.trim(),
      sender_id: currentUser.id, // Use current persona
      sender_type: 'recruiter',
      message_type: 'text'
    });

    // Optimistically update UI with sent message
    const newMessage = {
      id: response.data.id,
      senderId: currentUser.id,
      text: messageText.trim(),
      timestamp: 'Just now',
      type: 'text'
    };

    setSelectedConversation(prev => ({
      ...prev,
      messages: [...prev.messages, newMessage]
    }));

    setMessageText('');

    // Poll for new messages (including candidate responses)
    setTimeout(() => refreshMessages(), 1000);
  } catch (error) {
    console.error('Failed to send message:', error);
  }
};

// Add refresh function to get new messages
const refreshMessages = async () => {
  if (!selectedConversation) return;

  try {
    const response = await axios.get(
      `${API_BASE}/candidates/${selectedConversation.id}/messages`
    );

    const messages = response.data.map((msg: any) => ({
      id: msg.id,
      senderId: msg.sender_id,
      senderType: msg.sender_type,
      text: msg.content,
      timestamp: formatTimestamp(msg.created_at),
      type: msg.message_type
    }));

    setSelectedConversation(prev => ({
      ...prev,
      messages: messages
    }));
  } catch (error) {
    console.error('Failed to refresh messages:', error);
  }
};
```

### Option 2: Add User Switcher UI

Add this component to the Messages page header:

```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-400">Sending as:</span>
  <select
    value={currentUser.id}
    onChange={(e) => {
      const user = USER_PERSONAS.find(u => u.id === e.target.value);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('current_user_id', user.id);
      }
    }}
    className="px-3 py-2 bg-gray-900/60 border border-gray-800 rounded-lg text-sm"
  >
    {USER_PERSONAS.map(user => (
      <option key={user.id} value={user.id}>
        {user.name} - {user.role}
      </option>
    ))}
  </select>
</div>
```

### Option 3: Color-Code Messages by Sender

Update message rendering to show different colors:

```tsx
import { getUserColors } from './config/userPersonas';

const MessageBubble = ({ message }) => {
  const isRecruiter = message.senderType === 'recruiter';
  const colors = getUserColors(message.senderId);

  return (
    <div className={`flex ${isRecruiter ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-md px-4 py-3 rounded-2xl ${
          isRecruiter
            ? `${colors.bg} text-white`
            : 'bg-gray-900/60 border border-gray-800'
        }`}
      >
        {isRecruiter && (
          <p className="text-xs opacity-70 mb-1">
            {USER_PERSONAS.find(u => u.id === message.senderId)?.name}
          </p>
        )}
        <p className="text-sm">{message.text}</p>
      </div>
    </div>
  );
};
```

### Event Scheduling Integration

Update the handleScheduleMeeting function:

```typescript
const handleScheduleMeeting = async () => {
  if (!meetingDate || !meetingTime || !selectedConversation) {
    alert('Please fill in all meeting details');
    return;
  }

  try {
    const scheduledAt = new Date(`${meetingDate}T${meetingTime}:00Z`).toISOString();

    const response = await axios.post(`${API_BASE}/events`, {
      candidate_id: parseInt(selectedConversation.id),
      title: `${meetingType === 'video' ? 'Video' : 'Phone'} Interview`,
      description: `Interview with ${selectedConversation.name}`,
      event_type: 'phone_screen',
      scheduled_at: scheduledAt,
      duration: parseInt(meetingDuration),
      meeting_type: meetingType,
      notes: ''
    });

    // Show success message
    alert('Meeting scheduled successfully!');
    setShowScheduleModal(false);

    // Optionally add a message about the scheduled meeting
    await axios.post(`${API_BASE}/messages`, {
      candidate_id: parseInt(selectedConversation.id),
      content: `Meeting scheduled for ${meetingDate} at ${meetingTime}`,
      sender_id: currentUser.id,
      sender_type: 'recruiter',
      message_type: 'meeting',
      metadata: JSON.stringify(response.data)
    });
  } catch (error) {
    console.error('Failed to schedule meeting:', error);
    alert('Failed to schedule meeting');
  }
};
```

## 🚀 Quick Start Guide

1. **Backend is already running** on http://localhost:8000
2. **Database has new tables** (Message and Event)
3. **API endpoints are live** and tested

### Try it out:

```bash
# Send a message (30% chance of response)
curl -X POST http://localhost:8000/messages \
  -H "Content-Type: application/json" \
  -d @test_message.json

# Get conversation
curl http://localhost:8000/candidates/1/messages

# Schedule an event
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d @test_event.json

# Get all events
curl http://localhost:8000/events
```

## 📝 Example Workflow

1. **Initial Outreach** (as Alex Rivera - recruiter-1)
   - Send message to candidate
   - 30% chance they respond immediately

2. **Schedule Phone Screen** (as Alex Rivera)
   - Create event via /events endpoint
   - Send meeting confirmation message

3. **Technical Discussion** (switch to Michael Torres - hiring-manager-1)
   - Send technical questions
   - Candidate might respond with interest

4. **Final Round** (switch to David Kim - cto-1)
   - Schedule final interview
   - Discuss vision and culture

Each persona's messages are tracked separately, creating a realistic multi-person hiring team simulation!

## 🎯 Key Features Summary

✅ **Real Database Persistence** - All messages and events saved
✅ **Simulated Responses** - 30% candidate auto-response rate
✅ **Multi-User System** - 5 different recruiter/team personas
✅ **Event Scheduling** - Full calendar functionality
✅ **Tested & Working** - All endpoints verified
✅ **Ready for Frontend** - Just needs UI integration

## 📚 Documentation Files

1. **MESSAGING_GUIDE.md** - Comprehensive usage guide
2. **IMPLEMENTATION_SUMMARY.md** - This file
3. **frontend/src/config/userPersonas.ts** - User persona configuration

## Next Steps

The backend is **100% ready**. You just need to:

1. Update the Messages component to use the new API endpoints
2. (Optional) Add user switcher dropdown
3. (Optional) Color-code messages by sender
4. Test the full flow in the UI

Everything is set up for you to have realistic back-and-forth conversations with candidates and multiple team members!
