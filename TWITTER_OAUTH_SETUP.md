# Twitter OAuth Setup Guide

## Overview
This guide will help you set up Twitter OAuth 2.0 authentication to enable direct messaging (DM) functionality in TalentScout X.

## Prerequisites
- Twitter Developer Account
- Elevated API access (required for DM sending)

## Step 1: Create a Twitter App

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Click "Create Project" or select an existing project
3. Create a new App within your project
4. Note down your **Client ID** and **Client Secret**

## Step 2: Configure OAuth Settings

1. Navigate to your app settings
2. Under "User authentication settings", click "Set up"
3. Configure the following:

   **App permissions:**
   - Read
   - Write
   - Direct Messages (Read + Write)

   **Type of App:**
   - Web App, Automated App or Bot

   **App info:**
   - Callback URI: `http://localhost:8000/auth/twitter/callback`
   - Website URL: `http://localhost:3001`

4. Save your settings

## Step 3: Add Credentials to .env

Add the following to your `.env` file in the backend directory:

```env
# Twitter OAuth Configuration
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here
TWITTER_OAUTH_CALLBACK_URL=http://localhost:8000/auth/twitter/callback

# Existing Twitter API credentials
TWITTER_BEARER_TOKEN=your_bearer_token_here
```

## Step 4: Request Elevated Access

**IMPORTANT**: To send DMs, you need Elevated API access from Twitter.

1. In the Developer Portal, go to your project
2. Request "Elevated" access
3. Fill out the application explaining your use case:
   - *Example*: "Building a recruiting tool that helps companies connect with potential candidates via direct messages"
4. Wait for approval (usually 1-3 business days)

## Step 5: Test the Integration

1. Start your backend server:
   ```bash
   python main.py
   ```

2. Start your frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Navigate to Settings → Integrations in the app
4. Click "Connect Twitter"
5. You'll be redirected to Twitter to authorize the app
6. After approval, you'll be redirected back with authentication

## How It Works

### OAuth Flow:
1. User clicks "Connect Twitter" in Settings
2. App redirects to Twitter OAuth page
3. User authorizes the app
4. Twitter redirects back with an authorization code
5. Backend exchanges code for access token
6. Token is stored in localStorage for future DM sending

### Sending DMs:
- Once authenticated, messages sent in the Messages tab will attempt to send via Twitter DM
- The app checks for `twitter_access_token` in localStorage
- If found and candidate has a Twitter ID, message is sent via Twitter API
- Messages are also saved to local database as backup

## API Endpoints

**GET /auth/twitter/authorize**
- Returns Twitter OAuth URL and state

**GET /auth/twitter/callback**
- Handles OAuth callback
- Exchanges code for access token
- Redirects to frontend with token

**POST /messages/send-dm**
- Sends a DM to a Twitter user
- Required fields: `access_token`, `recipient_id`, `message`

## Troubleshooting

### "Failed to send DM" errors:
- Verify you have Elevated API access
- Check that DM permissions are enabled in app settings
- Ensure recipient allows DMs from anyone or follows your account

### OAuth callback errors:
- Verify callback URL matches exactly in Twitter settings
- Check that Client ID and Secret are correct in .env
- Ensure backend is running on port 8000

### Token expiration:
- Access tokens expire after ~2 hours
- Implement token refresh using the refresh_token (TODO)
- For now, users need to re-authenticate

## Security Notes

- **Never commit** `.env` file to git
- Store access tokens securely (currently in localStorage, consider moving to secure backend storage)
- Implement token refresh for production use
- Add rate limiting for DM sending to avoid API limits

## Production Deployment

When deploying to production:

1. Update callback URLs in Twitter Developer Portal:
   ```
   https://yourdomain.com/auth/twitter/callback
   ```

2. Update environment variables:
   ```env
   TWITTER_OAUTH_CALLBACK_URL=https://yourdomain.com/auth/twitter/callback
   FRONTEND_URL=https://yourdomain.com
   ```

3. Use HTTPS for all OAuth flows
4. Implement secure token storage (database with encryption)
5. Add token refresh logic
6. Implement proper session management

## Current Limitations

1. Tokens stored in localStorage (not ideal for production)
2. No token refresh implemented
3. DM sending requires Twitter ID to be stored in database
4. No batch DM support
5. Rate limiting not implemented

## Next Steps

- [ ] Implement token refresh logic
- [ ] Add secure backend token storage
- [ ] Store Twitter IDs when looking up candidates
- [ ] Add DM conversation history sync
- [ ] Implement rate limiting
- [ ] Add DM templates
- [ ] Support for rich media in DMs (images, links, etc.)
