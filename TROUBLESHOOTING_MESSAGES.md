# Troubleshooting Messages - Step by Step

## Current Status

Messages are being loaded when selecting a conversation, but not being sent properly from the frontend.

## Enhanced Logging

I've added detailed logging to `handleSendMessage`:
- Logs when message is being sent
- Logs the candidate ID
- Logs the payload being sent
- Logs success/failure

## How to Test

### 1. Open Browser Console
- Open frontend: http://localhost:3001
- Open browser DevTools (F12 or Cmd+Option+I)
- Go to Console tab

### 2. Go to Messages
- Click "Messages" in navigation
- Click on any candidate (e.g., "AIPRM")

**You should see:**
```
Loading messages for: AIPRM
Loaded messages: 0
```

### 3. Type and Send a Message
- Type in message box: "Hi! Interested in a role?"
- Click Send button

**You should see these logs:**
```
Sending message: Hi! Interested in a role?
To candidate ID: 19
Sending payload: {candidate_id: 19, content: "Hi! Interested in a role?", sender_id: "recruiter-1", ...}
Message sent successfully: {id: ..., content: ...}
(wait 3 seconds)
Refreshing messages to get AI response...
Loading messages for: AIPRM
Loaded messages: 2  (yours + AI response)
```

### 4. Check Backend Logs

```bash
tail -f backend_demo.log
```

**You should see:**
```
INFO: POST /messages HTTP/1.1 200 OK
✓ AI response generated for AIPRM
INFO: GET /candidates/19/messages HTTP/1.1 200 OK
```

## Common Issues

### Issue 1: "Cannot send: missing text or conversation"
**Cause:** Conversation not properly selected
**Fix:** Click on a candidate again to ensure conversation is loaded

### Issue 2: No POST request in logs
**Cause:** Frontend error before axios call
**Fix:** Check browser console for JavaScript errors

### Issue 3: POST fails with 400/500 error
**Cause:** Invalid payload or backend error
**Fix:** Check error details in console and backend logs

### Issue 4: Messages sent but not displaying
**Cause:** refreshMessages not being called or failing
**Fix:** Check console for "Refreshing messages..." log

## Manual API Test

If frontend isn't working, test backend directly:

```bash
# Send a message
curl -X POST http://localhost:8000/messages \\
  -H "Content-Type: application/json" \\
  -d '{
    "candidate_id": 19,
    "content": "Test message from curl",
    "sender_id": "recruiter-1",
    "sender_type": "recruiter",
    "message_type": "text"
  }'

# Wait 3 seconds for AI response

# Check messages
curl http://localhost:8000/candidates/19/messages | python -m json.tool
```

**Expected output:**
```json
[
  {
    "id": 1,
    "content": "Test message from curl",
    "sender_type": "recruiter",
    ...
  },
  {
    "id": 2,
    "content": "Thanks for reaching out! ...",
    "sender_type": "candidate",
    ...
  }
]
```

## Debug Checklist

- [ ] Backend running on http://localhost:8000
- [ ] Frontend running on http://localhost:3001
- [ ] Browser console open and monitoring logs
- [ ] Candidate conversation selected
- [ ] Message text entered
- [ ] Send button clicked
- [ ] Check "Sending message:" log appears
- [ ] Check "Message sent successfully:" log appears
- [ ] Wait 3 seconds
- [ ] Check "Refreshing messages..." log appears
- [ ] Check messages appear in UI

## Next Steps

1. **Try sending a message** with the enhanced logging
2. **Check console** for the detailed logs
3. **Report back** what you see in the console
4. If it's failing, we'll see exactly where in the logs

The enhanced logging will help us pinpoint exactly where the issue is!
