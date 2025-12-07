import { useState } from 'react';
import { Filter, Sparkles } from 'lucide-react';
import { CandidateCard } from './CandidateCard';
import { FilterModal } from './FilterModal';
import grokLogo from 'figma:asset/868077ec40f63747e6a75dda0a2da91f91b9a516.png';

interface CandidateFeedProps {
  onSelectCandidate: (id: string) => void;
}

const candidates = [
  {
    id: '1',
    name: 'Sarah Chen',
    handle: '@sarahbuilds',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    bio: 'Building AI tools for developers | React, TypeScript, LLMs | Previously @OpenAI',
    followers: '12.5K',
    following: '892',
    match: 95,
    tags: ['React', 'TypeScript', 'AI/ML', 'Open Source'],
    recentPost: 'Just shipped a new feature that reduces our build time by 40%. The key was optimizing our webpack config and lazy loading routes. Thread below 🧵',
    engagement: '234 replies · 1.2K likes',
    roles: ['Senior Frontend Engineer', 'ML Engineer']
  },
  {
    id: '2',
    name: 'Marcus Johnson',
    handle: '@marcusdev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    bio: 'Full-stack engineer | Building in public | Rust, Go, K8s | YC S23',
    followers: '8.9K',
    following: '654',
    match: 88,
    tags: ['Rust', 'Go', 'Kubernetes', 'DevOps'],
    recentPost: 'Launched my side project to 1000 users in 2 weeks. Here&apos;s what I learned about scaling with Rust and K8s...',
    engagement: '89 replies · 567 likes',
    roles: ['Backend Engineer']
  },
  {
    id: '3',
    name: 'Priya Patel',
    handle: '@priyacodes',
    avatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=400&h=400&fit=crop',
    bio: 'Frontend engineer passionate about accessibility | React, Vue, Web Performance',
    followers: '15.2K',
    following: '1.1K',
    match: 92,
    tags: ['Vue', 'React', 'A11y', 'Performance'],
    recentPost: 'Web accessibility isn&apos;t optional. Here are 5 simple changes that made our app usable for 10M more people...',
    engagement: '156 replies · 892 likes',
    roles: ['Senior Frontend Engineer']
  },
  {
    id: '4',
    name: 'Alex Rivera',
    handle: '@alexbuilds',
    avatar: 'https://images.unsplash.com/photo-1552788521-e5aca84994b5?w=400&h=400&fit=crop',
    bio: 'SWE @Stripe | Previously @Meta | Building side projects on weekends',
    followers: '6.7K',
    following: '423',
    match: 85,
    tags: ['Node.js', 'Python', 'AWS', 'Payments'],
    recentPost: 'Payment systems are fascinating. Deep dive into how we process millions of transactions per second at @Stripe...',
    engagement: '67 replies · 445 likes',
    roles: ['Backend Engineer']
  }
];

export function CandidateFeed({ onSelectCandidate }: CandidateFeedProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [activeJobFilter, setActiveJobFilter] = useState('all');
  const [showJobDropdown, setShowJobDropdown] = useState(false);

  const jobOptions = [
    { id: 'all', name: 'All Matches' },
    { id: 'senior-fe', name: 'Senior Frontend Engineer' },
    { id: 'ml-eng', name: 'ML Engineer' },
    { id: 'backend', name: 'Backend Engineer' },
  ];

  const selectedJob = jobOptions.find((job) => job.id === activeJobFilter);

  const filteredCandidates = activeJobFilter === 'all'
    ? candidates
    : candidates.filter(candidate =>
      candidate.roles && candidate.roles.some(role => role === selectedJob?.name)
    );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl border-b border-gray-800/50 z-10">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-2xl mb-1">Discover Talent</h1>
            <p className="text-sm text-gray-500">AI-matched candidates building in public</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Job Role Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowJobDropdown(!showJobDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-900/60 hover:bg-gray-800/80 rounded-xl border border-gray-800/50 transition-all"
              >
                <span className="text-sm">{selectedJob?.name}</span>
                <Filter className="w-4 h-4" />
              </button>

              {/* Dropdown Menu */}
              {showJobDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowJobDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-gray-950 border border-gray-800/50 rounded-xl overflow-hidden z-20 shadow-xl">
                    {jobOptions.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => {
                          setActiveJobFilter(job.id);
                          setShowJobDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${activeJobFilter === job.id
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-gray-300 hover:bg-gray-900/60'
                          }`}
                      >
                        <span>{job.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowFilters(true)}
              className="p-2.5 bg-gray-900/60 hover:bg-gray-800/80 rounded-xl transition-all border border-gray-800/50"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Candidates Feed */}
      <div className="flex-1 overflow-y-auto">
        {filteredCandidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onClick={() => onSelectCandidate(candidate.id)}
          />
        ))}
      </div>

      {/* Filter Modal */}
      {showFilters && <FilterModal onClose={() => setShowFilters(false)} />}
    </div>
  );
}