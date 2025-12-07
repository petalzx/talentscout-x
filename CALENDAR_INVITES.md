# Calendar Invite Feature

## ✨ What's New

When you schedule a meeting with a candidate, the system now **automatically**:
1. ✅ Generates a professional .ics calendar invite file
2. ✅ Sends a friendly message to the candidate with meeting details
3. ✅ Includes the calendar invite in the message metadata
4. ✅ Provides a download link for the .ics file
5. ✅ Adds a 15-minute reminder to the calendar event

## 🎯 How It Works

### Automatic Calendar Invites

When you create an event via `POST /events`, the system automatically:

```bash
# Create an event
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d '{
    "candidate_id": 1,
    "title": "Technical Interview",
    "description": "Discuss React and system design",
    "event_type": "technical",
    "scheduled_at": "2025-12-12T14:00:00Z",
    "duration": 60,
    "meeting_type": "video",
    "meeting_link": "https://meet.google.com/abc-defg-hij"
  }'

# Response includes:
{
  "id": 2,
  "calendar_invite_sent": true,  # ← New field!
  ...
}
```

### What the Candidate Receives

A message is automatically sent to the candidate with:

```
Hi [Candidate Name]!

I've scheduled our interview for December 12, 2025 at 02:00 PM (60 minutes).

Meeting Details:
• Type: Video call
• Duration: 60 minutes
• Join Link: https://meet.google.com/abc-defg-hij

A calendar invite has been sent to help you keep track of our meeting.

Looking forward to speaking with you!
```

### Calendar Invite (.ics) Contents

The generated .ics file includes:
- ✅ Event title and description
- ✅ Start and end times (UTC)
- ✅ Meeting link in description
- ✅ Organizer (Recruiting Team)
- ✅ Attendee (Candidate) with RSVP request
- ✅ 15-minute reminder before the meeting
- ✅ Confirmed status

## 📥 Download Calendar Invites

### API Endpoint

```bash
GET /events/{event_id}/calendar-invite
```

**Example:**
```bash
# Download the .ics file for event ID 2
curl http://localhost:8000/events/2/calendar-invite -o interview.ics

# Open the file to add to your calendar
open interview.ics  # macOS
start interview.ics  # Windows
xdg-open interview.ics  # Linux
```

The .ics file will automatically open in:
- **Apple Calendar** (macOS)
- **Outlook** (Windows)
- **Google Calendar** (if set as default)
- Any other calendar application

## 🔧 Technical Details

### Calendar Service

New service: `backend/services/calendar_service.py`

**Methods:**
- `generate_ics()` - Creates RFC 5545 compliant iCalendar file
- `create_calendar_message()` - Generates friendly invite message

**Features:**
- RFC 5545 (iCalendar) compliant format
- Proper escaping of special characters
- UTC timezone handling
- VALARM for reminders
- METHOD:REQUEST for meeting invitations

### Message Metadata

Calendar invites are stored in message metadata:

```json
{
  "event_id": 2,
  "calendar_invite": "BEGIN:VCALENDAR\n...",
  "meeting_link": "https://meet.google.com/...",
  "scheduled_at": "2025-12-12T14:00:00+00:00",
  "duration": 60
}
```

This allows:
- Retrieving the invite later
- Re-sending if needed
- Displaying meeting details in UI
- Downloading the .ics file

## 💡 Frontend Integration

### Display Calendar Invite Messages

In the Messages component, detect meeting type messages:

```typescript
if (message.message_type === 'meeting') {
  // Parse metadata
  const metadata = JSON.parse(message.metadata);

  // Show special UI for meeting invites
  return (
    <div className="meeting-invite-card">
      <CalendarIcon />
      <h4>Meeting Scheduled</h4>
      <p>{message.content}</p>

      {/* Download button */}
      <a
        href={`http://localhost:8000/events/${metadata.event_id}/calendar-invite`}
        download
        className="download-btn"
      >
        📅 Add to Calendar
      </a>
    </div>
  );
}
```

### Add to Calendar Button

```tsx
<a
  href={`${API_BASE}/events/${eventId}/calendar-invite`}
  download
  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg"
>
  📅 Download Calendar Invite
</a>
```

## 🎨 Example Use Case

### Scheduling Flow

1. **Recruiter schedules interview** via Messages UI
   ```typescript
   await scheduleEvent({
     candidate_id: 5,
     title: "Technical Interview",
     scheduled_at: "2025-12-12T14:00:00Z",
     duration: 60,
     meeting_type: "video",
     meeting_link: "https://zoom.us/j/123456789"
   });
   ```

2. **System automatically:**
   - Creates event in database
   - Generates .ics calendar file
   - Sends message to candidate with invite details
   - Stores calendar data in message metadata

3. **Candidate receives:**
   - Message with meeting details
   - Embedded calendar invite
   - Download link for .ics file

4. **Both parties can:**
   - Download the .ics file
   - Add to their calendar app
   - Get automatic reminders 15 minutes before

## 🚀 Testing

### Test Calendar Invite Creation

```bash
# 1. Schedule an event
curl -X POST http://localhost:8000/events \
  -H "Content-Type: application/json" \
  -d @test_calendar_event.json

# 2. Check messages for the candidate
curl http://localhost:8000/candidates/1/messages

# 3. Download the calendar invite
curl http://localhost:8000/events/2/calendar-invite -o invite.ics

# 4. Open in calendar app
open invite.ics
```

### Verify Calendar Invite

The .ics file should:
- ✅ Open in your default calendar app
- ✅ Show correct date and time
- ✅ Include meeting link in description
- ✅ List organizer and attendee
- ✅ Have a 15-minute reminder set

## 📋 Calendar Invite Format

```ics
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TalentScout X//Meeting Scheduler//EN
METHOD:REQUEST

BEGIN:VEVENT
UID:unique-event-id
DTSTART:20251212T140000Z
DTEND:20251212T150000Z
SUMMARY:Technical Interview - Frontend Role
DESCRIPTION:Discuss React expertise, system design
LOCATION:Video
ORGANIZER;CN=Recruiting Team:mailto:recruiting@company.com
ATTENDEE;CN=Candidate Name;RSVP=TRUE:mailto:candidate@example.com
STATUS:CONFIRMED

BEGIN:VALARM
TRIGGER:-PT15M
ACTION:DISPLAY
DESCRIPTION:Reminder: Meeting in 15 minutes
END:VALARM

END:VEVENT
END:VCALENDAR
```

## 🎯 Benefits

1. **Professional**: Candidates receive proper calendar invites
2. **Automatic**: No manual calendar file creation needed
3. **Universal**: Works with all major calendar apps
4. **Convenient**: One-click add to calendar
5. **Reliable**: Includes reminders and meeting links
6. **Trackable**: All invites stored in message history

## 📝 Notes

- Calendar invites use simulated emails (handle@example.com)
- In production, integrate with real email service
- .ics files are standard format - work everywhere
- Reminders are set to 15 minutes before meeting
- All times stored in UTC, displayed in local timezone by calendar app

The calendar invite system is now fully operational! 🎉
