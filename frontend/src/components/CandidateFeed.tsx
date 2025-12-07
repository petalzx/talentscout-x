import { useState, useEffect } from 'react';
import { Filter, Sparkles } from 'lucide-react';
import { CandidateCard } from './CandidateCard';
import { FilterModal } from './FilterModal';
import { JobSearchForm } from './JobSearchForm';
import grokLogo from 'figma:asset/868077ec40f63747e6a75dda0a2da91f91b9a516.png';
import axios from 'axios';

interface CandidateFeedProps {
  onSelectCandidate: (id: string) => void;
}

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

const API_BASE = 'http://localhost:8000';

export function CandidateFeed({ onSelectCandidate }: CandidateFeedProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJobTitle, setCurrentJobTitle] = useState<string>('');

  const handleSearch = async (jobTitle: string, keywords: string[]) => {
    setIsLoading(true);
    setError(null);
    setCurrentJobTitle(jobTitle);

    try {
      const response = await axios.post(`${API_BASE}/scout`, {
        job_title: jobTitle,
        keywords: keywords
      });

      // Transform API response to match frontend interface
      const transformedCandidates = response.data.map((candidate: any) => ({
        id: candidate.id,
        name: candidate.name,
        handle: candidate.handle,
        avatar: candidate.avatar,
        bio: candidate.bio,
        followers: candidate.followers,
        following: candidate.following || '0',
        match: candidate.match,
        tags: candidate.tags,
        recentPost: candidate.recent_post,
        engagement: candidate.engagement,
        roles: candidate.roles
      }));

      setCandidates(transformedCandidates);
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to search for candidates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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