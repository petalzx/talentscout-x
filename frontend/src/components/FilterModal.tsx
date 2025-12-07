import { X } from 'lucide-react';
import { useState } from 'react';

interface FilterModalProps {
  onClose: () => void;
}

export function FilterModal({ onClose }: FilterModalProps) {
  const [filters, setFilters] = useState({
    minFollowers: '',
    location: '',
    skills: [] as string[],
    experience: '',
    availability: '',
  });

  const skillOptions = [
    'React',
    'TypeScript',
    'Node.js',
    'Python',
    'Go',
    'Rust',
    'AI/ML',
    'DevOps',
    'AWS',
    'Kubernetes',
  ];

  const toggleSkill = (skill: string) => {
    setFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end">
      <div className="bg-gradient-to-b from-gray-950 to-black w-full rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-gray-800/50">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-gray-950 to-gray-950/95 backdrop-blur-xl border-b border-gray-800/50 p-5 flex items-center justify-between">
          <h2 className="text-xl">Filter Candidates</h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-900/60 rounded-xl transition-all border border-gray-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 space-y-6">
          {/* Minimum Followers */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Minimum Followers</label>
            <input
              type="number"
              value={filters.minFollowers}
              onChange={(e) => setFilters({ ...filters, minFollowers: e.target.value })}
              placeholder="e.g. 5000"
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Location</label>
            <input
              type="text"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              placeholder="e.g. San Francisco, Remote"
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Skills */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Skills & Technologies</label>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map((skill) => (
                <button
                  key={skill}
                  onClick={() => toggleSkill(skill)}
                  className={`px-4 py-2.5 rounded-xl transition-all ${
                    filters.skills.includes(skill)
                      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                      : 'bg-gray-900/60 text-gray-400 hover:bg-gray-800/80 border border-gray-800/50'
                  }`}
                >
                  {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Experience Level</label>
            <select
              value={filters.experience}
              onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              <option value="junior">Junior (0-2 years)</option>
              <option value="mid">Mid-level (3-5 years)</option>
              <option value="senior">Senior (6-10 years)</option>
              <option value="staff">Staff+ (10+ years)</option>
            </select>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Availability</label>
            <select
              value={filters.availability}
              onChange={(e) => setFilters({ ...filters, availability: e.target.value })}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any</option>
              <option value="immediate">Immediately available</option>
              <option value="2weeks">Available in 2 weeks</option>
              <option value="1month">Available in 1 month</option>
              <option value="passive">Passive (not actively looking)</option>
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-950 via-gray-950 to-gray-950/95 backdrop-blur-xl border-t border-gray-800/50 p-4 flex gap-3">
          <button
            onClick={() => setFilters({ minFollowers: '', location: '', skills: [], experience: '', availability: '' })}
            className="flex-1 px-4 py-3.5 border border-gray-700/50 text-white rounded-xl hover:bg-gray-900/60 transition-all bg-gray-900/40"
          >
            Clear All
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
