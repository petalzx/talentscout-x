import { ArrowLeft, Calendar, Mail, MessageCircle, Star, TrendingUp, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { ScheduleModal } from './ScheduleModal';

interface CandidateProfileProps {
  candidateId: string;
  onBack: () => void;
}

export function CandidateProfile({ candidateId, onBack }: CandidateProfileProps) {
  const [showSchedule, setShowSchedule] = useState(false);
  const [pipelineStage, setPipelineStage] = useState<string | null>(null);

  // Mock data - in real app, fetch based on candidateId
  const candidateData = {
    '1': {
      id: '1',
      name: 'Sarah Chen',
      handle: '@sarahbuilds',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
      bio: 'Building AI tools for developers | React, TypeScript, LLMs | Previously @OpenAI',
      location: 'San Francisco, CA',
      website: 'sarahchen.dev',
      followers: '12.5K',
      following: '892',
      match: 95,
      tags: ['React', 'TypeScript', 'AI/ML', 'Open Source', 'Node.js', 'Python'],
      insights: [
        'Strong technical blog with 50K+ monthly readers',
        'Active contributor to popular React libraries',
        'Previously led AI team at OpenAI for 3 years'
      ],
      recentPosts: [
        {
          id: '1',
          content: 'Just shipped a new feature that reduces our build time by 40%. The key was optimizing our webpack config and lazy loading routes. Thread below 🧵',
          replies: 234,
          likes: 1200,
          time: '2h ago'
        },
        {
          id: '2',
          content: 'Hot take: TypeScript is not just \"JavaScript with types\". It fundamentally changes how you architect systems. Here\'s why...',
          replies: 189,
          likes: 892,
          time: '1d ago'
        },
        {
          id: '3',
          content: 'Building in public day 47: Our AI SDK just hit 10K downloads! Lessons learned about developer experience and API design.',
          replies: 156,
          likes: 743,
          time: '3d ago'
        }
      ]
    },
    '2': {
      id: '2',
      name: 'Marcus Johnson',
      handle: '@marcusdev',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      bio: 'Backend Engineer | Scaling distributed systems | Go, Rust, Kubernetes | Building the future of cloud infrastructure',
      location: 'Austin, TX',
      website: 'marcusjohnson.io',
      followers: '8.3K',
      following: '654',
      match: 88,
      tags: ['Go', 'Rust', 'Kubernetes', 'Distributed Systems', 'Cloud', 'Docker'],
      insights: [
        'Expert in building high-performance distributed systems',
        'Contributed to major open source cloud projects',
        'Previously at Amazon Web Services for 5 years'
      ],
      recentPosts: [
        {
          id: '1',
          content: 'Deep dive into how we scaled our API from 1K to 100K requests per second. Spoiler: it wasn\'t just about throwing more servers at it 🧵',
          replies: 145,
          likes: 876,
          time: '4h ago'
        },
        {
          id: '2',
          content: 'Why I switched from Node.js to Go for backend services. Performance gains were real but that wasn\'t the main reason...',
          replies: 298,
          likes: 1543,
          time: '2d ago'
        }
      ]
    },
    '3': {
      id: '3',
      name: 'Priya Patel',
      handle: '@priyacodes',
      avatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=400&h=400&fit=crop',
      bio: 'Frontend Engineer & Design Systems Lead | React, Vue, CSS | Creating beautiful, accessible web experiences',
      location: 'New York, NY',
      website: 'priyapatel.design',
      followers: '15.2K',
      following: '723',
      match: 92,
      tags: ['React', 'Vue', 'CSS', 'Design Systems', 'Accessibility', 'UI/UX'],
      insights: [
        'Led design system adoption at Fortune 500 company',
        'Passionate advocate for web accessibility',
        'Speaker at major frontend conferences'
      ],
      recentPosts: [
        {
          id: '1',
          content: 'Just published our company\'s design system library! 50+ components, full accessibility support, and dark mode out of the box 🎨',
          replies: 187,
          likes: 1432,
          time: '1h ago'
        },
        {
          id: '2',
          content: 'CSS Container Queries are a game changer. Here\'s how we\'re using them to build truly responsive components...',
          replies: 234,
          likes: 1876,
          time: '1d ago'
        }
      ]
    },
    '4': {
      id: '4',
      name: 'Alex Rivera',
      handle: '@alexbuilds',
      avatar: 'https://images.unsplash.com/photo-1552788521-e5aca84994b5?w=400&h=400&fit=crop',
      bio: 'Full-stack Engineer | Node.js, Python, PostgreSQL | Building scalable SaaS products | Tech lead @startup',
      location: 'Seattle, WA',
      website: 'alexrivera.dev',
      followers: '6.8K',
      following: '445',
      match: 85,
      tags: ['Node.js', 'Python', 'PostgreSQL', 'SaaS', 'APIs', 'GraphQL'],
      insights: [
        'Successfully scaled SaaS product to 1M+ users',
        'Strong background in database optimization',
        'Experience leading engineering teams'
      ],
      recentPosts: [
        {
          id: '1',
          content: 'Lessons from building a GraphQL API that serves 10M+ queries per day. Thread on performance, caching, and monitoring 🚀',
          replies: 167,
          likes: 943,
          time: '3h ago'
        }
      ]
    },
    '5': {
      id: '5',
      name: 'Jordan Lee',
      handle: '@jordantech',
      avatar: 'https://images.unsplash.com/photo-1604336732494-d8386c7029e3?w=400&h=400&fit=crop',
      bio: 'Senior Frontend Engineer | React, Next.js, Web Performance | Making the web faster, one optimization at a time',
      location: 'Portland, OR',
      website: 'jordanlee.tech',
      followers: '9.1K',
      following: '567',
      match: 89,
      tags: ['React', 'Next.js', 'Performance', 'Webpack', 'Vite', 'TypeScript'],
      insights: [
        'Expert in web performance optimization',
        'Contributed to Next.js and Vite projects',
        'Reduced app load times by 60% at previous company'
      ],
      recentPosts: [
        {
          id: '1',
          content: 'How we achieved a perfect 100 Lighthouse score on our e-commerce site. Spoiler: it required rethinking everything 🧵',
          replies: 298,
          likes: 2134,
          time: '5h ago'
        }
      ]
    },
    '6': {
      id: '6',
      name: 'Emma Watson',
      handle: '@emmacodes',
      avatar: 'https://images.unsplash.com/photo-1620216464663-29984da34a12?w=400&h=400&fit=crop',
      bio: 'ML Engineer | PyTorch, TensorFlow, NLP | Building intelligent systems | PhD in Computer Science',
      location: 'Boston, MA',
      website: 'emmawatson.ai',
      followers: '11.4K',
      following: '389',
      match: 91,
      tags: ['Machine Learning', 'PyTorch', 'NLP', 'Python', 'AI', 'Research'],
      insights: [
        'PhD focused on natural language processing',
        'Published papers in top AI conferences',
        'Built ML models serving millions of predictions daily'
      ],
      recentPosts: [
        {
          id: '1',
          content: 'New paper accepted at NeurIPS! We achieved state-of-the-art results on language understanding tasks. Preprint coming soon 📄',
          replies: 234,
          likes: 1876,
          time: '2h ago'
        }
      ]
    },
    '7': {
      id: '7',
      name: 'David Kim',
      handle: '@davidbuilds',
      avatar: 'https://images.unsplash.com/photo-1719400471588-575b23e27bd7?w=400&h=400&fit=crop',
      bio: 'ML Infrastructure Engineer | Kubernetes, MLOps, Python | Scaling ML systems in production',
      location: 'San Jose, CA',
      website: 'davidkim.ml',
      followers: '7.6K',
      following: '423',
      match: 87,
      tags: ['MLOps', 'Kubernetes', 'Python', 'TensorFlow', 'AWS', 'Infrastructure'],
      insights: [
        'Built ML infrastructure for autonomous vehicles',
        'Expert in deploying models at scale',
        'Strong DevOps and infrastructure background'
      ],
      recentPosts: [
        {
          id: '1',
          content: 'How we deploy ML models to production with zero downtime. A deep dive into our MLOps pipeline 🚀',
          replies: 145,
          likes: 834,
          time: '6h ago'
        }
      ]
    },
    '8': {
      id: '8',
      name: 'Sophie Turner',
      handle: '@sophietech',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
      bio: 'Backend Engineer | Microservices, Event-Driven Architecture | Python, Go | Building resilient systems',
      location: 'Denver, CO',
      website: 'sophieturner.dev',
      followers: '10.2K',
      following: '612',
      match: 93,
      tags: ['Python', 'Go', 'Microservices', 'Event-Driven', 'RabbitMQ', 'Redis'],
      insights: [
        'Architected event-driven system processing 1B+ events/day',
        'Strong expertise in distributed systems patterns',
        'Led migration from monolith to microservices'
      ],
      recentPosts: [
        {
          id: '1',
          content: 'Why we chose event-driven architecture over REST for our microservices. The trade-offs nobody talks about 🧵',
          replies: 267,
          likes: 1654,
          time: '4h ago'
        }
      ]
    }
  };

  const candidate = candidateData[candidateId as keyof typeof candidateData];

  // Handle case when candidate is not found
  if (!candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-900/50 flex items-center justify-center">
          <ArrowLeft className="w-8 h-8 text-gray-700" />
        </div>
        <h2 className="text-lg mb-2">Candidate Not Found</h2>
        <p className="text-gray-500 mb-6">This candidate profile could not be loaded.</p>
        <button
          onClick={onBack}
          className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

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
            <h1 className="font-semibold">{candidate.name}</h1>
            <p className="text-sm text-gray-500">324 posts</p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Cover & Avatar */}
        <div className="relative">
          <div className="h-28 bg-gradient-to-br from-blue-600 via-blue-500 to-purple-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>
          <img
            src={candidate.avatar}
            alt={candidate.name}
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
          <button className="p-2 border border-gray-700/50 rounded-xl hover:bg-gray-900/60 transition-all bg-gray-900/40">
            <Mail className="w-4 h-4" />
          </button>
          <button className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/20">
            Message
          </button>
        </div>

        {/* Info */}
        <div className="px-4 mb-4">
          <h2 className="text-lg mb-0.5">{candidate.name}</h2>
          <p className="text-gray-500 text-sm mb-2">{candidate.handle}</p>
          <p className="text-sm mb-2 leading-relaxed">{candidate.bio}</p>
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
            <span>{candidate.location}</span>
            <a href="#" className="flex items-center gap-1 text-blue-500 hover:underline">
              {candidate.website}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>
              <span className="text-white">{candidate.followers}</span>{' '}
              <span className="text-gray-500">followers</span>
            </span>
            <span>
              <span className="text-white">{candidate.following}</span>{' '}
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
              <span className="text-2xl text-blue-400">{candidate.match}</span>
              <span className="text-sm text-blue-500/60">%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {candidate.insights.map((insight, i) => (
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
            {candidate.tags.map((tag) => (
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
          {candidate.recentPosts.map((post) => (
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
                <span>{post.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Schedule Modal */}
      {showSchedule && (
        <ScheduleModal
          candidateName={candidate.name}
          onClose={() => setShowSchedule(false)}
        />
      )}
    </div>
  );
}