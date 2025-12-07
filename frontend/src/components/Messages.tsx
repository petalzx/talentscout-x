import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

interface Conversation {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  role: string;
}

const mockMessages = [
  "Thanks for reaching out! I'd love to learn more about the role.",
  "Looking forward to our call tomorrow at 2pm!",
  "Could we reschedule to next week?",
  "Thanks for the update on the timeline.",
  "I'm very interested in this opportunity!",
  "When can we schedule a technical interview?",
  "I have some questions about the tech stack.",
  "Sounds great, I'll send over my portfolio.",
  "What's the expected start date?",
  "I'm available for a phone call this week.",
  "Let me know if you need any additional information.",
  "I'm excited to discuss this further!",
];

const mockTimestamps = ['2h ago', '5h ago', '1d ago', '2d ago', '3d ago', '1w ago'];

export function Messages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        const response = await axios.get(`${API_BASE}/candidates`);
        const candidates = response.data;

        // Select random candidates for conversations and create mock conversations
        const selectedCandidates = candidates
          .sort(() => 0.5 - Math.random()) // Shuffle
          .slice(0, 12); // Take 12 random candidates

        const mockConversations: Conversation[] = selectedCandidates.map((candidate: any, index: number) => ({
          id: candidate.id,
          name: candidate.name,
          handle: candidate.handle,
          avatar: candidate.avatar,
          lastMessage: mockMessages[index % mockMessages.length],
          timestamp: mockTimestamps[index % mockTimestamps.length],
          unread: Math.random() > 0.7, // 30% chance of being unread
          role: candidate.roles?.[0] || 'Developer',
        }));

        setConversations(mockConversations);
      } catch (error) {
        console.error('Failed to load conversations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadConversations();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl border-b border-gray-800/50 z-10">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl">Messages</h1>
            <span className="text-sm text-gray-400">
              {isLoading ? 'Loading...' : `${conversations.length} conversations`}
            </span>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search messages"
              className="w-full bg-gray-900/60 text-white placeholder-gray-500 pl-12 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 border border-gray-800/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">Loading conversations...</div>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-400">No conversations found</div>
          </div>
        ) : (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-start gap-4 p-5 border-b border-gray-800/50 hover:bg-gradient-to-r hover:from-gray-900/40 hover:to-transparent cursor-pointer transition-all group"
            >
              <div className="relative">
                <img
                  src={conv.avatar}
                  alt={conv.name}
                  className="w-14 h-14 rounded-full ring-2 ring-gray-800/50 group-hover:ring-blue-500/30 transition-all"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{conv.name}</span>
                    <span className="text-gray-500 text-sm">{conv.handle}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-700/50 text-gray-300 rounded-full">
                      {conv.role}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">{conv.timestamp}</span>
                </div>
                <p
                  className={`text-sm truncate ${
                    conv.unread ? 'text-white' : 'text-gray-500'
                  }`}
                >
                  {conv.lastMessage}
                </p>
              </div>
              {conv.unread && (
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full mt-2 shadow-lg shadow-blue-500/50"></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}