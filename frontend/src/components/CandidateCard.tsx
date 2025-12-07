import { Heart, MessageCircle, UserPlus, TrendingUp, Briefcase } from 'lucide-react';

interface Candidate {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followers: string;
  following: string;
  match: number;
  tags: string[];
  recentPost: string;
  engagement: string;
  roles?: string[];
}

interface CandidateCardProps {
  candidate: Candidate;
  onClick: () => void;
}

export function CandidateCard({ candidate, onClick }: CandidateCardProps) {
  return (
    <div
      onClick={onClick}
      className="border-b border-gray-800/50 p-4 hover:bg-gradient-to-r hover:from-gray-900/40 hover:to-transparent cursor-pointer transition-all"
    >
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className="relative">
          <img
            src={candidate.avatar}
            alt={candidate.name}
            className="w-12 h-12 rounded-full ring-2 ring-gray-800/50"
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="font-semibold text-sm">{candidate.name}</span>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-full">
              <TrendingUp className="w-3 h-3 text-blue-400" />
              <span className="text-xs text-blue-400/70">AI Match</span>
              <span className="text-xs text-blue-400">{candidate.match}%</span>
            </div>
          </div>
          <span className="text-gray-500 text-xs">{candidate.handle}</span>
        </div>
      </div>

      {/* Bio */}
      <p className="text-xs mb-2 text-gray-300 leading-relaxed">{candidate.bio}</p>

      {/* Tags and Roles Combined */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {/* Role badges first */}
        {candidate.roles && candidate.roles.map((role) => (
          <span
            key={role}
            className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded-md border border-blue-500/30 flex items-center gap-1"
          >
            <Briefcase className="w-3 h-3" />
            {role}
          </span>
        ))}
        {/* Then skill tags */}
        {candidate.tags.map((tag) => (
          <span
            key={tag}
            className="px-2 py-0.5 bg-gradient-to-br from-gray-800 to-gray-900 text-gray-300 text-xs rounded-lg border border-gray-700/50"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Recent Post */}
      <div className="bg-gradient-to-br from-gray-900/80 to-gray-900/40 rounded-xl p-3 mb-2 border border-gray-800/50">
        <p className="text-xs text-gray-300 mb-1.5 leading-relaxed">{candidate.recentPost}</p>
        <span className="text-xs text-gray-500">{candidate.engagement}</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <span>
          <span className="text-white">{candidate.followers}</span> followers
        </span>
        <span>
          <span className="text-white">{candidate.following}</span> following
        </span>
      </div>
    </div>
  );
}
