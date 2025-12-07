import httpx
import secrets
import base64
import hashlib
from typing import Optional, Dict
from ..config.settings import settings

class TwitterOAuthService:
    """Handle Twitter OAuth 2.0 PKCE flow for user authentication and DM sending"""

    def __init__(self):
        self.client_id = settings.TWITTER_CLIENT_ID
        self.client_secret = settings.TWITTER_CLIENT_SECRET
        self.callback_url = settings.TWITTER_OAUTH_CALLBACK_URL
        self.oauth_url = "https://twitter.com/i/oauth2/authorize"
        self.token_url = "https://api.twitter.com/2/oauth2/token"

        # In-memory storage for OAuth state (in production, use Redis or database)
        self.oauth_states: Dict[str, Dict] = {}

    def generate_pkce_pair(self):
        """Generate PKCE code verifier and challenge"""
        code_verifier = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode('utf-8').rstrip('=')
        code_challenge = base64.urlsafe_b64encode(
            hashlib.sha256(code_verifier.encode('utf-8')).digest()
        ).decode('utf-8').rstrip('=')
        return code_verifier, code_challenge

    def get_authorization_url(self) -> Dict[str, str]:
        """Generate Twitter OAuth authorization URL with PKCE"""
        # Generate state for CSRF protection
        state = secrets.token_urlsafe(32)

        # Generate PKCE pair
        code_verifier, code_challenge = self.generate_pkce_pair()

        # Store state and verifier
        self.oauth_states[state] = {
            'code_verifier': code_verifier,
            'code_challenge': code_challenge
        }

        # OAuth scopes for DM sending
        scopes = [
            'tweet.read',
            'users.read',
            'dm.write',
            'dm.read'
        ]

        # Build authorization URL
        params = {
            'response_type': 'code',
            'client_id': self.client_id,
            'redirect_uri': self.callback_url,
            'scope': ' '.join(scopes),
            'state': state,
            'code_challenge': code_challenge,
            'code_challenge_method': 'S256'
        }

        auth_url = f"{self.oauth_url}?{'&'.join(f'{k}={v}' for k, v in params.items())}"

        return {
            'auth_url': auth_url,
            'state': state
        }

    async def exchange_code_for_token(self, code: str, state: str) -> Optional[Dict]:
        """Exchange authorization code for access token"""
        # Verify state exists
        if state not in self.oauth_states:
            raise ValueError("Invalid OAuth state")

        oauth_data = self.oauth_states[state]
        code_verifier = oauth_data['code_verifier']

        # Exchange code for token
        async with httpx.AsyncClient() as client:
            data = {
                'grant_type': 'authorization_code',
                'code': code,
                'redirect_uri': self.callback_url,
                'code_verifier': code_verifier,
                'client_id': self.client_id
            }

            # Basic auth with client credentials
            auth = base64.b64encode(f"{self.client_id}:{self.client_secret}".encode()).decode()
            headers = {
                'Authorization': f'Basic {auth}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }

            response = await client.post(self.token_url, data=data, headers=headers)

            if response.status_code != 200:
                print(f"Token exchange error: {response.status_code} - {response.text}")
                return None

            token_data = response.json()

            # Clean up state
            del self.oauth_states[state]

            return {
                'access_token': token_data['access_token'],
                'refresh_token': token_data.get('refresh_token'),
                'expires_in': token_data.get('expires_in', 7200),
                'scope': token_data.get('scope', '')
            }

    async def send_dm(self, access_token: str, recipient_id: str, message: str) -> bool:
        """Send a direct message to a Twitter user"""
        async with httpx.AsyncClient() as client:
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }

            data = {
                'conversationId': recipient_id,
                'text': message
            }

            response = await client.post(
                f"{settings.TWITTER_BASE_URL}/dm_conversations/with/{recipient_id}/messages",
                headers=headers,
                json=data
            )

            if response.status_code in [200, 201]:
                print(f"✓ DM sent to user {recipient_id}")
                return True
            else:
                print(f"✗ Failed to send DM: {response.status_code} - {response.text}")
                return False

    async def get_authenticated_user(self, access_token: str) -> Optional[Dict]:
        """Get the authenticated user's info"""
        async with httpx.AsyncClient() as client:
            headers = {
                'Authorization': f'Bearer {access_token}'
            }

            response = await client.get(
                f"{settings.TWITTER_BASE_URL}/users/me",
                headers=headers,
                params={'user.fields': 'id,name,username'}
            )

            if response.status_code == 200:
                data = response.json()
                return data.get('data')

            return None
