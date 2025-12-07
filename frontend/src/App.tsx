import React, { useState } from 'react';
import { CandidateFeed } from './components/CandidateFeed';
import { CandidateProfile } from './components/CandidateProfile';
import { Pipeline } from './components/Pipeline';
import { Messages } from './components/Messages';
import { Feedback } from './components/Feedback';
import { Settings as SettingsComponent } from './components/Settings';
import { Search, Users, Briefcase, MessageCircle, Settings, LogOut, ThumbsUp } from 'lucide-react';
import grokLogo from 'figma:asset/868077ec40f63747e6a75dda0a2da91f91b9a516.png';

export default function App() {
  const [activeTab, setActiveTab] = useState('discover');
  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [messagesCandidateId, setMessagesCandidateId] = useState<string | null>(null);

  const handleNavigateToMessages = (candidateId: string) => {
    setMessagesCandidateId(candidateId);
    setSelectedCandidate(null);
    setActiveTab('messages');
  };

  const renderContent = () => {
    if (selectedCandidate) {
      return (
        <CandidateProfile
          candidateId={selectedCandidate}
          onBack={() => setSelectedCandidate(null)}
          onNavigateToMessages={handleNavigateToMessages}
        />
      );
    }

    switch (activeTab) {
      case 'discover':
        return <CandidateFeed onSelectCandidate={setSelectedCandidate} />;
      case 'pipeline':
        return <Pipeline onSelectCandidate={setSelectedCandidate} />;
      case 'messages':
        return (
          <Messages
            onSelectCandidate={setSelectedCandidate}
            openConversationId={messagesCandidateId}
            onConversationOpened={() => setMessagesCandidateId(null)}
          />
        );
      case 'feedback':
        return <Feedback onSelectCandidate={setSelectedCandidate} />;
      case 'settings':
        return <SettingsComponent />;
      default:
        return <CandidateFeed onSelectCandidate={setSelectedCandidate} />;
    }
  };

  return (
    <div className="flex h-screen bg-black text-white">
      {/* Sidebar Navigation */}
      <div className="w-64 border-r border-gray-800/50 flex flex-col">
        {/* Logo */}
        <div className="p-6 border-b border-gray-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl">
              <img src={grokLogo} alt="Grok" className="w-6 h-6 invert" />
            </div>
            <div>
              <h1 className="font-semibold">Grok Recruiter</h1>
              <p className="text-xs text-gray-500">AI-Powered Hiring</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <button
            onClick={() => {
              setActiveTab('discover');
              setSelectedCandidate(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              activeTab === 'discover'
                ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
            }`}
          >
            <Search className="w-5 h-5" strokeWidth={2} />
            <span>Discover</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('pipeline');
              setSelectedCandidate(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              activeTab === 'pipeline'
                ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
            }`}
          >
            <Briefcase className="w-5 h-5" strokeWidth={2} />
            <span>Pipeline</span>
            <span className="ml-auto px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">8</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('messages');
              setSelectedCandidate(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              activeTab === 'messages'
                ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
            }`}
          >
            <MessageCircle className="w-5 h-5" strokeWidth={2} />
            <span>Messages</span>
            <span className="ml-auto px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">3</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('feedback');
              setSelectedCandidate(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all mb-2 ${
              activeTab === 'feedback'
                ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
            }`}
          >
            <ThumbsUp className="w-5 h-5" strokeWidth={2} />
            <span>Feedback</span>
          </button>

          <div className="h-px bg-gray-800/50 my-4"></div>

          <button
            onClick={() => {
              setActiveTab('settings');
              setSelectedCandidate(null);
            }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'settings'
                ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30'
                : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
            }`}
          >
            <Settings className="w-5 h-5" strokeWidth={2} />
            <span>Settings</span>
          </button>
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800/50">
          <div className="flex items-center gap-3 px-2">
            <img
              src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop"
              alt="User"
              className="w-10 h-10 rounded-full ring-2 ring-gray-800/50"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">Jessica Park</p>
              <p className="text-xs text-gray-500 truncate">Recruiter</p>
            </div>
            <button className="p-2 hover:bg-gray-900/60 rounded-lg transition-all text-gray-500 hover:text-gray-300">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
