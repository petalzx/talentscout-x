import { Search } from 'lucide-react';

const conversations = [
  {
    id: '1',
    name: 'Sarah Chen',
    handle: '@sarahbuilds',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    lastMessage: 'Thanks for reaching out! I&apos;d love to learn more about the role.',
    timestamp: '2h ago',
    unread: true,
  },
  {
    id: '2',
    name: 'Priya Patel',
    handle: '@priyacodes',
    avatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=400&h=400&fit=crop',
    lastMessage: 'Looking forward to our call tomorrow at 2pm!',
    timestamp: '5h ago',
    unread: false,
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    handle: '@marcusdev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    lastMessage: 'Could we reschedule to next week?',
    timestamp: '1d ago',
    unread: false,
  },
  {
    id: '4',
    name: 'Alex Rivera',
    handle: '@alexbuilds',
    avatar: 'https://images.unsplash.com/photo-1552788521-e5aca84994b5?w=400&h=400&fit=crop',
    lastMessage: 'Thanks for the update on the timeline.',
    timestamp: '2d ago',
    unread: false,
  },
];

export function Messages() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl border-b border-gray-800/50 z-10">
        <div className="p-4">
          <h1 className="text-xl mb-4">Messages</h1>
          
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
        {conversations.map((conv) => (
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
        ))}
      </div>
    </div>
  );
}