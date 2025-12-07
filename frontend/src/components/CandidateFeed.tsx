import React, { useState, useEffect } from 'react';
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
  const [showJobSearch, setShowJobSearch] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentJobTitle, setCurrentJobTitle] = useState<string>('');

  // Load seeded data on component mount
  useEffect(() => {
    loadAllCandidates();
  }, []);

  const loadAllCandidates = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_BASE}/candidates`);

      // Transform API response to match frontend interface
      const transformedCandidates = response.data.map((candidate: any) => ({
        id: candidate.id,
        name: candidate.name,
        handle: candidate.handle,
        avatar: candidate.avatar,
        bio: candidate.bio,
        followers: candidate.followers,
        following: '0', // API doesn't provide following count
        match: candidate.match,
        tags: candidate.tags,
        recentPost: candidate.recent_post,
        engagement: '2.4%', // Mock engagement rate
        roles: candidate.roles
      }));

      setCandidates(transformedCandidates);
    } catch (err) {
      console.error('Load candidates error:', err);
      setError('Failed to load candidates. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
        following: '0',
        match: candidate.match,
        tags: candidate.tags,
        recentPost: candidate.recent_post,
        engagement: '2.4%',
        roles: candidate.roles
      }));

      setCandidates(transformedCandidates);
      setShowJobSearch(false); // Hide search form after successful search
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
            <p className="text-sm text-gray-500">AI-matched candidates {candidates.length > 0 && `(${candidates.length} found)`}</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search Button */}
            <button
              onClick={() => setShowJobSearch(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl border border-blue-500/30 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">New Search</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={loadAllCandidates}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900/60 hover:bg-gray-800/80 rounded-xl border border-gray-800/50 transition-all"
            >
              <span className="text-sm">All Candidates</span>
            </button>

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

      {/* Job Search Results Header */}
      {currentJobTitle && (
        <div className="px-6 py-3 bg-gray-900/30 border-b border-gray-800/50">
          <p className="text-sm text-gray-400">
            Search results for: <span className="text-blue-400 font-medium">{currentJobTitle}</span>
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading candidates...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-400">{error}</div>
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">No candidates found</div>
          </div>
        ) : (
          candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onClick={() => onSelectCandidate(candidate.id)}
            />
          ))
        )}
      </div>

      {/* Job Search Modal */}
      {showJobSearch && (
        <JobSearchForm
          onSearch={handleSearch}
          onClose={() => setShowJobSearch(false)}
        />
      )}

      {/* Filter Modal */}
      {showFilters && <FilterModal onClose={() => setShowFilters(false)} />}
    </div>
  );
}