import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Mail, MessageCircle, Star, TrendingUp, ExternalLink } from 'lucide-react';
import { ScheduleModal } from './ScheduleModal';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

interface CandidateProfileProps {
  candidateId: string;
  onBack: () => void;
  onNavigateToMessages: (candidateId: string) => void;
}

interface TweetData {
  id: string;
  content: string;
  likes: number;
  retweets: number;
  replies: number;
  created_at: string;
}

interface ProfileData {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followers: string;
  following: string;
  match: number;
  tags: string[];
  roles: string[];
  location?: string;
  website?: string;
  header_image?: string;
  insights: string[];
  recent_posts: TweetData[];
}

export function CandidateProfile({ candidateId, onBack, onNavigateToMessages }: CandidateProfileProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [candidateId]);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/candidates/${candidateId}`);
      setProfile(response.data);
    } catch (err) {
      console.error('Load profile error:', err);
      setError('Failed to load candidate profile');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="text-gray-400">Loading profile...</div>
      </div>
    );
  }

  // Show error state
  if (error || !profile) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-900/50 flex items-center justify-center">
          <ArrowLeft className="w-8 h-8 text-gray-700" />
        </div>
        <h2 className="text-lg mb-2">Candidate Not Found</h2>
        <p className="text-gray-500 mb-6">{error || 'This candidate profile could not be loaded.'}</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  const formatTime = (isoString: string) => {
    if (!isoString) return 'Recently';
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Recently';
  };

  const stages = ['Qualified', 'Screening', 'Round 1', 'Round 2', 'Final', 'Offer'];

  return (
    <div className="flex flex-col h-full bg-black">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl border-b border-gray-800/50 z-10">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={onBack}
            className="p-2.5 hover:bg-gray-900/60 rounded-xl transition-all border border-gray-800/50"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-semibold">{profile.name}</h1>
            <p className="text-sm text-gray-500">{profile.recent_posts.length} posts</p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover & Avatar */}
        <div className="relative">
          {profile.header_image ? (
            <div className="h-28 relative overflow-hidden bg-gray-900">
              <img
                src={profile.header_image}
                alt={`${profile.name} header`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          ) : (
            <div className="h-28 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
            </div>
          )}
          <img
            src={profile.avatar}
            alt={profile.name}
            className="absolute -bottom-10 left-4 w-20 h-20 rounded-full border-4 border-black ring-2 ring-gray-800/50"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 px-4 pt-2 mb-4">
          <button
            onClick={() => setShowSchedule(true)}
            className="p-2 border border-gray-700/50 rounded-xl hover:bg-gray-900/60 transition-all bg-gray-900/40"
          >
            <Calendar className="w-4 h-4" />
          </button>
          <button
            onClick={() => onNavigateToMessages(candidateId)}
            className="p-2 border border-gray-700/50 rounded-xl hover:bg-gray-900/60 transition-all bg-gray-900/40"
          >
            <Mail className="w-4 h-4" />
          </button>
        </div>

        {/* Info */}
        <div className="px-4 mb-4">
          <h2 className="text-lg mb-0.5">{profile.name}</h2>
          <p className="text-gray-500 text-sm mb-2">{profile.handle}</p>
          <p className="text-sm mb-2 leading-relaxed">{profile.bio}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            {profile.location && <span>{profile.location}</span>}
            {profile.website && (
              <a href={`https://${profile.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-500 hover:underline">
                {profile.website}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>
              <span className="text-white">{profile.followers}</span>{' '}
              <span className="text-gray-500">followers</span>
            </span>
            <span>
              <span className="text-white">{profile.following}</span>{' '}
              <span className="text-gray-500">following</span>
            </span>
          </div>
        </div>

        {/* AI Match Score */}
        <div className="mx-4 mb-4 p-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/5 border border-blue-500/30 rounded-2xl backdrop-blur-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <span className="font-semibold text-sm">AI Match Score</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl text-blue-400">{profile.match}</span>
              <span className="text-sm text-blue-500/60">%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {profile.insights.map((insight, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-400">
                <Star className="w-3 h-3 mt-0.5 text-blue-400 flex-shrink-0" fill="currentColor" />
                <span className="leading-relaxed">{insight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="px-4 mb-4">
          <div className="flex flex-wrap gap-1.5">
            {profile.tags.map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 bg-gray-900 text-gray-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Pipeline Stage */}
        <div className="px-4 mb-4">
          <h3 className="text-xs text-gray-500 mb-2">Pipeline Stage</h3>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {stages.map((stage) => (
              <button
                key={stage}
                onClick={() => setPipelineStage(stage)}
                className={`px-3 py-2 rounded-xl whitespace-nowrap transition-all text-sm ${
                  pipelineStage === stage
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-900/60 text-gray-400 hover:bg-gray-800/80 border border-gray-800/50'
                }`}
              >
                {stage}
              </button>
            ))}
          </div>
        </div>

        {/* Recent Posts */}
        <div className="border-t border-gray-800 pt-3">
          <h3 className="px-4 font-semibold mb-3 text-sm">Recent Posts</h3>
          {profile.recent_posts.length > 0 ? (
            profile.recent_posts.map((post) => (
              <div key={post.id} className="border-b border-gray-800 p-4 hover:bg-gray-900/50">
                <p className="mb-2 text-sm leading-relaxed">{post.content}</p>
                <div className="flex items-center gap-6 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" />
                    {post.replies}
                  </span>
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    {post.likes}
                  </span>
                  <span>{formatTime(post.created_at)}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-8 text-center text-gray-500 text-sm">
              No recent posts available
            </div>
          )}
        </div>
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <ScheduleModal
          candidateName={profile.name}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </div>
  );
}
