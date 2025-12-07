import os
from xdk import Client  # pip install xdk-python or equivalent? Wait, pasted xdk – Assume tweepy or requests for PKCE
# Simplified OAuth2 PKCE for user token (pasted thread code)
# Run to authorize browser, get token for .env TWITTER_USER_ACCESS_TOKEN

CLIENT_ID = os.getenv('TWITTER_CLIENT_ID') or input("Enter CLIENT_ID from app OAuth2 tab: ")
CLIENT_SECRET = os.getenv('TWITTER_CLIENT_SECRET') or input("Enter CLIENT_SECRET: ")
REDIRECT_URI = "https://console.x.com"  # Or local http://localhost:3000/callback – Match app callback URL

scopes = ["tweet.read", "users.read", "bookmark.read", "offline.access"]

# Step 1: Auth URL
auth_url = f"https://x.com/i/oauth2/authorize?response_type=code&client_id={CLIENT_ID}&redirect_uri={urllib.parse.quote(REDIRECT_URI)}&scope={urllib.parse.quote(' '.join(scopes))}&state=state&code_challenge=challenge&code_challenge_method=plain&state=state"
print("Visit:", auth_url)
print("Authorize → Paste full callback URL below")

callback_url = input("Callback URL: ")

# Step 2: Extract code from callback
from urllib.parse import parse_qs, urlparse
parsed = urlparse(callback_url)
code = parse_qs(parsed.query).get('code', [None])[0]
if not code:
    print("No code in callback – Check redirect_uri/app callback match")
    exit()

# Step 3: Exchange code for token (PKCE – Simplified; Needs code_challenge_method=S256 for prod)
import requests
token_url = "https://api.twitter.com/2/oauth2/token"
data = {
    "code": code,
    "grant_type": "authorization_code",
    "client_id": CLIENT_ID,
    "redirect_uri": REDIRECT_URI,
    "code_verifier": "verifier"  # For plain; S256 for secure
}
headers = {"Content-Type": "application/x-www-form-urlencoded"}
resp = requests.post(token_url, data=data, headers=headers, auth=(CLIENT_ID, CLIENT_SECRET))
if resp.status_code == 200:
    tokens = resp.json()
    access_token = tokens["access_token"]
    print("User Access Token:", access_token)
    print(".env: TWITTER_USER_ACCESS_TOKEN=" + access_token)
else:
    print("Token exchange error:", resp.text)