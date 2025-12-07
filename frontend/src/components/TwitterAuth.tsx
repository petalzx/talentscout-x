import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Twitter, Check, X, AlertCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8000';

interface TwitterAuthProps {
  onAuthSuccess?: (token: string, username: string) => void;
}

export function TwitterAuth({ onAuthSuccess }: TwitterAuthProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUsername, setAuthenticatedUsername] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if we have stored Twitter auth
    const storedToken = localStorage.getItem('twitter_access_token');
    const storedUsername = localStorage.getItem('twitter_username');

    if (storedToken && storedUsername) {
      setIsAuthenticated(true);
      setAuthenticatedUsername(storedUsername);
    }

    // Handle OAuth callback
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('access_token');
    const username = params.get('username');
    const authError = params.get('error');

    if (authError) {
      setError(`Authentication failed: ${authError}`);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (accessToken && username) {
      // Save to localStorage
      localStorage.setItem('twitter_access_token', accessToken);
      localStorage.setItem('twitter_username', username);
      setIsAuthenticated(true);
      setAuthenticatedUsername(username);

      if (onAuthSuccess) {
        onAuthSuccess(accessToken, username);
      }

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [onAuthSuccess]);

  const handleConnect = async () => {
    try {
      setIsAuthenticating(true);
      setError(null);

      const response = await axios.get(`${API_BASE}/auth/twitter/authorize`);
      const { auth_url } = response.data;

      // Redirect to Twitter OAuth
      window.location.href = auth_url;
    } catch (err: any) {
      setError('Failed to initiate Twitter authentication');
      setIsAuthenticating(false);
      console.error('Twitter auth error:', err);
    }
  };

  const handleDisconnect = () => {
    localStorage.removeItem('twitter_access_token');
    localStorage.removeItem('twitter_username');
    setIsAuthenticated(false);
    setAuthenticatedUsername(null);
  };

  return (
    <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
            <Twitter className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-medium">Twitter / X Integration</h3>
            <p className="text-sm text-gray-400">
              {isAuthenticated
                ? `Connected as @${authenticatedUsername}`
                : 'Connect to send direct messages to candidates'}
            </p>
          </div>
        </div>

        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg">
              <Check className="w-4 h-4" />
              <span className="text-sm">Connected</span>
            </div>
            <button
              onClick={handleDisconnect}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-all text-sm"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={handleConnect}
            disabled={isAuthenticating}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Twitter className="w-4 h-4" />
            {isAuthenticating ? 'Connecting...' : 'Connect Twitter'}
          </button>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-400">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isAuthenticated && (
        <div className="mt-4 p-4 bg-gray-900/60 rounded-lg border border-gray-800">
          <h4 className="text-sm font-medium mb-2">Enabled Features:</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Send direct messages to candidates
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Read message conversations
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-400" />
              Access candidate profiles
            </li>
          </ul>
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <p className="text-xs text-blue-300/80">
          <strong>Note:</strong> You need to have your Twitter app approved for DM access in the Twitter
          Developer Portal for this to work. Messages will be sent from your connected Twitter account.
        </p>
      </div>
    </div>
  );
}
