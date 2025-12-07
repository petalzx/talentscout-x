import React, { useState, useEffect } from 'react';
import { Search, Send, Calendar, FileText, Paperclip, X, Clock, Video, Phone, MoreVertical, ChevronLeft, Sparkles, Wand2, Users, Briefcase, MessageSquare } from 'lucide-react';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

type MessageTab = 'candidates' | 'internal';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  type: 'text' | 'meeting' | 'assessment' | 'feedback';
  meetingData?: {
    date: string;
    time: string;
    duration: string;
    type: 'video' | 'phone';
  };
  assessmentData?: {
    title: string;
    status: 'sent' | 'completed' | 'pending';
  };
  feedbackData?: {
    candidateName: string;
    candidateAvatar: string;
    candidateRole: string;
    rating: number;
    recommendation: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  messages: Message[];
  isInternal?: boolean;
  coworkerTitle?: string;
  isSearchResult?: boolean;
}

// Mock data for realistic conversation previews
const mockLastMessages = [
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

// Mock candidate conversations (will be replaced with real data)
const candidateConversations: Conversation[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    handle: '@sarahbuilds',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    role: 'Senior Frontend Engineer',
    lastMessage: 'Thanks for reaching out! I\'d love to learn more about the role.',
    timestamp: '2h ago',
    unread: true,
    messages: [
      {
        id: '1',
        senderId: 'recruiter',
        text: 'Hi Sarah! I came across your profile and was impressed by your work on the open-source design system. We have a Senior Frontend Engineer role that I think would be a great fit for you.',
        timestamp: '3h ago',
        type: 'text',
      },
      {
        id: '2',
        senderId: '1',
        text: 'Thanks for reaching out! I\'d love to learn more about the role.',
        timestamp: '2h ago',
        type: 'text',
      },
    ],
  },
  {
    id: '2',
    name: 'Priya Patel',
    handle: '@priyacodes',
    avatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=400&h=400&fit=crop',
    role: 'ML Engineer',
    lastMessage: 'Looking forward to our call tomorrow at 2pm!',
    timestamp: '5h ago',
    unread: false,
    messages: [
      {
        id: '1',
        senderId: 'recruiter',
        text: 'Hi Priya! Your ML research looks fantastic. Would you be open to discussing our ML Engineer position?',
        timestamp: '2d ago',
        type: 'text',
      },
      {
        id: '2',
        senderId: '2',
        text: 'Absolutely! I\'m very interested.',
        timestamp: '1d ago',
        type: 'text',
      },
      {
        id: '3',
        senderId: 'recruiter',
        text: 'Great! Let\'s schedule a call to discuss further.',
        timestamp: '1d ago',
        type: 'meeting',
        meetingData: {
          date: 'Dec 8, 2025',
          time: '2:00 PM',
          duration: '30 min',
          type: 'video',
        },
      },
      {
        id: '4',
        senderId: '2',
        text: 'Looking forward to our call tomorrow at 2pm!',
        timestamp: '5h ago',
        type: 'text',
      },
    ],
  },
  {
    id: '3',
    name: 'Marcus Johnson',
    handle: '@marcusdev',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    role: 'Backend Engineer',
    lastMessage: 'Could we reschedule to next week?',
    timestamp: '1d ago',
    unread: false,
    messages: [
      {
        id: '1',
        senderId: 'recruiter',
        text: 'Hi Marcus! Your backend architecture posts caught my attention. I have a role that might interest you.',
        timestamp: '3d ago',
        type: 'text',
      },
      {
        id: '2',
        senderId: '3',
        text: 'Could we reschedule to next week?',
        timestamp: '1d ago',
        type: 'text',
      },
    ],
  },
];

const internalConversations: Conversation[] = [
  {
    id: 'i1',
    name: 'Michael Chen',
    handle: '@mchen',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    role: 'Engineering Manager',
    coworkerTitle: 'Engineering Manager',
    lastMessage: 'Just finished the interview with Priya - sending feedback now',
    timestamp: '1h ago',
    unread: true,
    isInternal: true,
    messages: [
      {
        id: '1',
        senderId: 'recruiter',
        text: 'Hey Michael! Do you have time to interview Priya Patel this week?',
        timestamp: '2d ago',
        type: 'text',
      },
      {
        id: '2',
        senderId: 'i1',
        text: 'Yeah, I can do Thursday afternoon. Send me her profile?',
        timestamp: '2d ago',
        type: 'text',
      },
      {
        id: '3',
        senderId: 'i1',
        text: 'Just finished the interview with Priya - sending feedback now',
        timestamp: '1h ago',
        type: 'text',
      },
      {
        id: '4',
        senderId: 'i1',
        text: '',
        timestamp: '1h ago',
        type: 'feedback',
        feedbackData: {
          candidateName: 'Priya Patel',
          candidateAvatar: 'https://images.unsplash.com/photo-1603415526960-f7e0328c63b1?w=400&h=400&fit=crop',
          candidateRole: 'Senior Frontend Engineer',
          rating: 4,
          recommendation: 'Strong technical foundation, would advance to next round',
        },
      },
    ],
  },
  {
    id: 'i2',
    name: 'Sarah Williams',
    handle: '@swilliams',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    role: 'Senior Backend Engineer',
    coworkerTitle: 'Senior Backend Engineer',
    lastMessage: 'What\'s our pipeline looking like for this quarter?',
    timestamp: '3h ago',
    unread: false,
    isInternal: true,
    messages: [
      {
        id: '1',
        senderId: 'i2',
        text: 'What\'s our pipeline looking like for this quarter?',
        timestamp: '3h ago',
        type: 'text',
      },
    ],
  },
  {
    id: 'i3',
    name: 'James Rodriguez',
    handle: '@jrodriguez',
    avatar: 'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?w=400&h=400&fit=crop',
    role: 'CTO',
    coworkerTitle: 'CTO',
    lastMessage: 'Sophie Turner is an exceptional candidate',
    timestamp: '1d ago',
    unread: false,
    isInternal: true,
    messages: [
      {
        id: '1',
        senderId: 'recruiter',
        text: 'Sophie Turner is ready for the final round. Can you interview her this week?',
        timestamp: '2d ago',
        type: 'text',
      },
      {
        id: '2',
        senderId: 'i3',
        text: 'Sure, let\'s set it up for Friday.',
        timestamp: '2d ago',
        type: 'text',
      },
      {
        id: '3',
        senderId: 'i3',
        text: 'Sophie Turner is an exceptional candidate',
        timestamp: '1d ago',
        type: 'text',
      },
      {
        id: '4',
        senderId: 'i3',
        text: '',
        timestamp: '1d ago',
        type: 'feedback',
        feedbackData: {
          candidateName: 'Sophie Turner',
          candidateAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
          candidateRole: 'Backend Engineer',
          rating: 5,
          recommendation: 'Exceptional technical depth and leadership potential. Strong hire.',
        },
      },
    ],
  },
];

interface MessagesProps {
  onSelectCandidate: (candidateId: string) => void;
  openConversationId?: string | null;
  onConversationOpened?: () => void;
}

export function Messages({ onSelectCandidate, openConversationId, onConversationOpened }: MessagesProps) {
  const [activeTab, setActiveTab] = useState<MessageTab>('candidates');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMode, setSearchMode] = useState<'conversations' | 'candidates' | 'username'>('conversations');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAIMessageModal, setShowAIMessageModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');

  // Real candidates state
  const [realCandidateConversations, setRealCandidateConversations] = useState<Conversation[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);

  // All candidates from database (for candidate search mode)
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Schedule meeting form
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [meetingType, setMeetingType] = useState<'video' | 'phone'>('video');

  // Assessment form
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentTimeLimit, setAssessmentTimeLimit] = useState('no-limit');

  // Feedback form
  const [feedbackCandidate, setFeedbackCandidate] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(3);
  const [feedbackRecommendation, setFeedbackRecommendation] = useState('');

  // Load real candidates with notifications on mount
  useEffect(() => {
    const loadCandidates = async () => {
      setIsLoadingCandidates(true);
      try {
        const response = await axios.get(`${API_BASE}/candidates`);
        const candidates = response.data;

        // Store all candidates for search
        setAllCandidates(candidates);

        // Load conversations only for candidates who have notifications
        const conversationsPromises = candidates.map(async (candidate: any) => {
          try {
            const notifResponse = await axios.get(`${API_BASE}/candidates/${candidate.id}/notifications`);
            const notifications = notifResponse.data;

            if (notifications.length === 0) return null; // Skip candidates with no notifications

            // Convert notifications to messages
            const messages: Message[] = notifications.map((notif: any, idx: number) => ({
              id: `notif-${notif.id}`,
              senderId: 'recruiter',
              text: notif.message,
              timestamp: formatNotificationTime(notif.sent_at),
              type: 'text' as const,
            }));

            const lastNotif = notifications[0];
            return {
              id: candidate.id,
              name: candidate.name,
              handle: candidate.handle,
              avatar: candidate.avatar,
              role: candidate.roles?.[0] || 'Developer',
              lastMessage: lastNotif.message.substring(0, 60) + '...',
              timestamp: formatNotificationTime(lastNotif.sent_at),
              unread: false,
              messages: messages.reverse(), // Show oldest first
            };
          } catch (err) {
            return null; // Skip candidates with notification fetch errors
          }
        });

        const allConversations = await Promise.all(conversationsPromises);
        const validConversations = allConversations.filter(conv => conv !== null) as Conversation[];

        setRealCandidateConversations(validConversations);
      } catch (error) {
        console.error('Failed to load candidates:', error);
        setRealCandidateConversations([]);
      } finally {
        setIsLoadingCandidates(false);
      }
    };

    loadCandidates();
  }, []);

  const formatNotificationTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  // Auto-open conversation when navigating from profile
  useEffect(() => {
    const openOrCreateConversation = async () => {
      if (!openConversationId) return;

      // Wait for candidates to finish loading
      if (isLoadingCandidates) return;

      console.log('Opening conversation for candidate ID:', openConversationId);

      // First check if conversation already exists (compare as strings since IDs come as strings from props)
      let conversation = realCandidateConversations.find((conv) => String(conv.id) === String(openConversationId));

      // If not, fetch the candidate and their notifications to create a new conversation
      if (!conversation) {
        console.log('Conversation not found, creating new one...');
        console.log('Fetching candidate with ID:', openConversationId);
        try {
          const response = await axios.get(`${API_BASE}/candidates/${openConversationId}`);
          const candidate = response.data;
          console.log('Fetched candidate:', candidate);

          // Fetch notifications for this candidate
          const notifResponse = await axios.get(`${API_BASE}/candidates/${openConversationId}/notifications`);
          const notifications = notifResponse.data;
          console.log('Fetched notifications:', notifications.length);

          // Convert notifications to messages
          const messages: Message[] = notifications.length > 0
            ? notifications.map((notif: any) => ({
                id: `notif-${notif.id}`,
                senderId: 'recruiter',
                text: notif.message,
                timestamp: formatNotificationTime(notif.sent_at),
                type: 'text' as const,
              })).reverse() // Show oldest first
            : []; // Empty if no notifications yet

          // Create new conversation object
          conversation = {
            id: candidate.id,
            name: candidate.name,
            handle: candidate.handle,
            avatar: candidate.avatar,
            role: candidate.roles?.[0] || 'Developer',
            lastMessage: notifications.length > 0 ? notifications[0].message.substring(0, 60) + '...' : 'Start a conversation',
            timestamp: notifications.length > 0 ? formatNotificationTime(notifications[0].sent_at) : 'Now',
            unread: false,
            messages: messages,
          };

          // Add to conversations list if not already there
          setRealCandidateConversations((prev: Conversation[]) => {
            // Check if already exists (compare as strings)
            if (prev.find(c => String(c.id) === String(conversation!.id))) {
              return prev;
            }
            return [conversation!, ...prev];
          });

          console.log('Created new conversation for', candidate.name);
        } catch (error: any) {
          console.error('Failed to fetch candidate for conversation:', error);
          console.error('Error details:', {
            candidateId: openConversationId,
            status: error.response?.status,
            message: error.message,
            url: error.config?.url
          });

          // If candidate not found, try to find them in the allCandidates list
          const fallbackCandidate = allCandidates.find(c => String(c.id) === String(openConversationId));
          if (fallbackCandidate) {
            console.log('Found candidate in local cache, using fallback:', fallbackCandidate.name);
            // Create conversation without fetching from API
            conversation = {
              id: fallbackCandidate.id,
              name: fallbackCandidate.name,
              handle: fallbackCandidate.handle,
              avatar: fallbackCandidate.avatar,
              role: fallbackCandidate.roles?.[0] || 'Developer',
              lastMessage: 'Start a conversation',
              timestamp: 'Now',
              unread: false,
              messages: [],
            };

            setRealCandidateConversations((prev: Conversation[]) => {
              if (prev.find(c => String(c.id) === String(conversation!.id))) {
                return prev;
              }
              return [conversation!, ...prev];
            });
          } else {
            console.error('Candidate not found in cache either');
            if (onConversationOpened) {
              onConversationOpened();
            }
            return;
          }
        }
      } else {
        console.log('Found existing conversation for', conversation.name);
      }

      // Open the conversation
      console.log('Opening conversation:', conversation.name);
      console.log('Setting selected conversation to:', conversation);
      setSelectedConversation(conversation);
      setActiveTab('candidates');

      // Notify parent that conversation was opened (this clears the trigger)
      if (onConversationOpened) {
        console.log('Calling onConversationOpened callback');
        onConversationOpened();
      }
    };

    openOrCreateConversation();
  }, [openConversationId, realCandidateConversations, isLoadingCandidates, onConversationOpened]);

  // Debug selected conversation changes
  useEffect(() => {
    console.log('Selected conversation changed:', selectedConversation?.name || 'null');
  }, [selectedConversation]);

  // Handle opening a conversation from candidate search results
  const handleOpenCandidateConversation = async (candidateId: string) => {
    console.log('Opening conversation for candidate from search:', candidateId);

    // Check if conversation already exists
    let conversation = realCandidateConversations.find((conv) => String(conv.id) === String(candidateId));

    if (!conversation) {
      // Create new conversation
      try {
        const candidate = allCandidates.find(c => String(c.id) === String(candidateId));
        if (!candidate) {
          console.error('Candidate not found:', candidateId);
          return;
        }

        // Fetch notifications
        const notifResponse = await axios.get(`${API_BASE}/candidates/${candidateId}/notifications`);
        const notifications = notifResponse.data;

        const messages: Message[] = notifications.length > 0
          ? notifications.map((notif: any) => ({
              id: `notif-${notif.id}`,
              senderId: 'recruiter',
              text: notif.message,
              timestamp: formatNotificationTime(notif.sent_at),
              type: 'text' as const,
            })).reverse()
          : [];

        conversation = {
          id: candidate.id,
          name: candidate.name,
          handle: candidate.handle,
          avatar: candidate.avatar,
          role: candidate.roles?.[0] || 'Developer',
          lastMessage: notifications.length > 0 ? notifications[0].message.substring(0, 60) + '...' : 'Start a conversation',
          timestamp: notifications.length > 0 ? formatNotificationTime(notifications[0].sent_at) : 'Now',
          unread: false,
          messages: messages,
        };

        // Add to conversations list
        setRealCandidateConversations((prev: Conversation[]) => {
          if (prev.find(c => String(c.id) === String(conversation!.id))) {
            return prev;
          }
          return [conversation!, ...prev];
        });
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return;
      }
    }

    setSelectedConversation(conversation);
  };

  const currentConversations = activeTab === 'candidates'
    ? (isLoadingCandidates ? [] : realCandidateConversations)
    : internalConversations;

  // Filter based on search mode
  const getFilteredResults = () => {
    if (!searchQuery.trim()) {
      return currentConversations;
    }

    const query = searchQuery.toLowerCase();

    if (activeTab === 'internal') {
      // Always search conversations for internal tab
      return currentConversations.filter((conv) =>
        conv.name.toLowerCase().includes(query) ||
        conv.handle.toLowerCase().includes(query)
      );
    }

    // For candidates tab, use search mode
    if (searchMode === 'conversations') {
      return currentConversations.filter((conv) =>
        conv.name.toLowerCase().includes(query) ||
        conv.handle.toLowerCase().includes(query)
      );
    } else if (searchMode === 'candidates') {
      // Search all candidates in database
      return allCandidates
        .filter((cand: any) =>
          cand.name.toLowerCase().includes(query) ||
          cand.handle.toLowerCase().includes(query) ||
          cand.bio?.toLowerCase().includes(query)
        )
        .map((cand: any) => ({
          id: cand.id,
          name: cand.name,
          handle: cand.handle,
          avatar: cand.avatar,
          role: cand.roles?.[0] || 'Developer',
          lastMessage: cand.bio?.substring(0, 60) + '...' || 'No bio',
          timestamp: '',
          unread: false,
          messages: [],
          isSearchResult: true,
        }));
    } else if (searchMode === 'username') {
      // Search by Twitter username
      return allCandidates
        .filter((cand: any) =>
          cand.handle.toLowerCase().includes(query)
        )
        .map((cand: any) => ({
          id: cand.id,
          name: cand.name,
          handle: cand.handle,
          avatar: cand.avatar,
          role: cand.roles?.[0] || 'Developer',
          lastMessage: cand.bio?.substring(0, 60) + '...' || 'No bio',
          timestamp: '',
          unread: false,
          messages: [],
          isSearchResult: true,
        }));
    }

    return currentConversations;
  };

  const filteredConversations = getFilteredResults();

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) return;

    const messageContent = messageText.trim();
    console.log('Sending message:', messageContent);

    // Create a temporary message ID
    const tempMessageId = `temp-${Date.now()}`;
    const newMessage: Message = {
      id: tempMessageId,
      senderId: 'recruiter',
      text: messageContent,
      timestamp: 'Just now',
      type: 'text',
    };

    // Optimistically update UI
    setSelectedConversation((prev: Conversation | null) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: messageContent.substring(0, 60) + (messageContent.length > 60 ? '...' : ''),
        timestamp: 'Just now',
      };
    });

    // Update in conversations list
    setRealCandidateConversations(prev =>
      prev.map(conv => {
        if (String(conv.id) === String(selectedConversation.id)) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: messageContent.substring(0, 60) + (messageContent.length > 60 ? '...' : ''),
            timestamp: 'Just now',
          };
        }
        return conv;
      })
    );

    // Clear input
    setMessageText('');

    // Save to backend as a notification
    try {
      await axios.post(`${API_BASE}/notifications`, {
        candidate_id: parseInt(selectedConversation.id),
        message: messageContent,
        event_type: 'message',
        from_stage: null,
        to_stage: null,
        is_ai_generated: false,
      });
      console.log('Message saved to backend');
    } catch (error) {
      console.error('Failed to save message to backend:', error);
      // Message still shows in UI, just not persisted
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingDate || !meetingTime || !selectedConversation) {
      alert('Please fill in all meeting details');
      return;
    }

    const meetingMessage: Message = {
      id: `meeting-${Date.now()}`,
      senderId: 'recruiter',
      text: '',
      timestamp: 'Just now',
      type: 'meeting',
      meetingData: {
        date: new Date(meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        time: meetingTime,
        duration: `${meetingDuration} min`,
        type: meetingType,
      },
    };

    // Update UI
    setSelectedConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, meetingMessage],
        lastMessage: `Meeting scheduled for ${meetingMessage.meetingData?.date}`,
        timestamp: 'Just now',
      };
    });

    // Update conversations list
    setRealCandidateConversations(prev =>
      prev.map(conv => {
        if (String(conv.id) === String(selectedConversation.id)) {
          return {
            ...conv,
            messages: [...conv.messages, meetingMessage],
            lastMessage: `Meeting scheduled for ${meetingMessage.meetingData?.date}`,
            timestamp: 'Just now',
          };
        }
        return conv;
      })
    );

    // Save to backend
    try {
      await axios.post(`${API_BASE}/notifications`, {
        candidate_id: parseInt(selectedConversation.id),
        message: `Meeting scheduled for ${meetingMessage.meetingData?.date} at ${meetingTime} (${meetingDuration} min ${meetingType} call)`,
        event_type: 'meeting_scheduled',
        from_stage: null,
        to_stage: null,
        is_ai_generated: false,
      });
    } catch (error) {
      console.error('Failed to save meeting to backend:', error);
    }

    setShowScheduleModal(false);
    setMeetingDate('');
    setMeetingTime('');
    setMeetingDuration('30');
    setMeetingType('video');
  };

  const handleSendAssessment = async () => {
    if (!assessmentTitle.trim() || !selectedConversation) {
      alert('Please enter an assessment title');
      return;
    }

    const assessmentMessage: Message = {
      id: `assessment-${Date.now()}`,
      senderId: 'recruiter',
      text: '',
      timestamp: 'Just now',
      type: 'assessment',
      assessmentData: {
        title: assessmentTitle,
        status: 'sent',
      },
    };

    // Update UI
    setSelectedConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, assessmentMessage],
        lastMessage: `Assessment sent: ${assessmentTitle}`,
        timestamp: 'Just now',
      };
    });

    // Update conversations list
    setRealCandidateConversations(prev =>
      prev.map(conv => {
        if (String(conv.id) === String(selectedConversation.id)) {
          return {
            ...conv,
            messages: [...conv.messages, assessmentMessage],
            lastMessage: `Assessment sent: ${assessmentTitle}`,
            timestamp: 'Just now',
          };
        }
        return conv;
      })
    );

    // Save to backend
    try {
      await axios.post(`${API_BASE}/notifications`, {
        candidate_id: parseInt(selectedConversation.id),
        message: `Assessment sent: ${assessmentTitle} (Time limit: ${assessmentTimeLimit === 'no-limit' ? 'No limit' : assessmentTimeLimit + ' hours'})`,
        event_type: 'assessment_sent',
        from_stage: null,
        to_stage: null,
        is_ai_generated: false,
      });
    } catch (error) {
      console.error('Failed to save assessment to backend:', error);
    }

    setShowAssessmentModal(false);
    setAssessmentTitle('');
    setAssessmentTimeLimit('no-limit');
  };

  const handleSendFeedback = () => {
    if (!feedbackCandidate || !feedbackRecommendation.trim()) {
      alert('Please fill in all feedback fields');
      return;
    }
    console.log('Sending feedback:', { feedbackCandidate, feedbackRating, feedbackRecommendation });
    setShowFeedbackModal(false);
    setFeedbackCandidate('');
    setFeedbackRating(3);
    setFeedbackRecommendation('');
  };

  const handleGenerateAIMessage = async (messageType: string) => {
    setAiGenerating(true);
    setShowAIMessageModal(true);

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const messages = {
      initial: `Hi ${selectedConversation?.name}! I came across your profile and was really impressed by your work on ${selectedConversation?.role === 'Senior Frontend Engineer' ? 'design systems and component architecture' : selectedConversation?.role === 'ML Engineer' ? 'machine learning research and model optimization' : 'backend infrastructure and API design'}.\n\nWe have a ${selectedConversation?.role} position at Acme Inc. that I think would be a great fit for your skillset. Would you be interested in learning more about this opportunity?`,
      followup: `Thanks for your interest! Our ${selectedConversation?.role} role offers the opportunity to work on cutting-edge projects with a collaborative team. The position includes competitive compensation, remote flexibility, and significant growth potential.\n\nWould you be available for a brief call next week to discuss the role in more detail?`,
      assessment: `Thanks for taking the time to speak with me! Based on our conversation, I think you'd be a strong candidate for this role.\n\nThe next step would be a technical assessment to better understand your approach to problem-solving. Would you be open to completing a coding challenge? It typically takes about 1-2 hours and you can complete it at your convenience.`,
    };

    setGeneratedMessage(messages[messageType as keyof typeof messages] || messages.initial);
    setAiGenerating(false);
  };

  const useAIMessage = async () => {
    if (!generatedMessage.trim() || !selectedConversation) return;

    const messageContent = generatedMessage.trim();

    const newMessage: Message = {
      id: `ai-${Date.now()}`,
      senderId: 'recruiter',
      text: messageContent,
      timestamp: 'Just now',
      type: 'text',
    };

    // Update UI
    setSelectedConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
        lastMessage: messageContent.substring(0, 60) + (messageContent.length > 60 ? '...' : ''),
        timestamp: 'Just now',
      };
    });

    // Update conversations list
    setRealCandidateConversations(prev =>
      prev.map(conv => {
        if (String(conv.id) === String(selectedConversation.id)) {
          return {
            ...conv,
            messages: [...conv.messages, newMessage],
            lastMessage: messageContent.substring(0, 60) + (messageContent.length > 60 ? '...' : ''),
            timestamp: 'Just now',
          };
        }
        return conv;
      })
    );

    // Save to backend
    try {
      await axios.post(`${API_BASE}/notifications`, {
        candidate_id: parseInt(selectedConversation.id),
        message: messageContent,
        event_type: 'message',
        from_stage: null,
        to_stage: null,
        is_ai_generated: true,
      });
      console.log('AI message saved to backend');
    } catch (error) {
      console.error('Failed to save AI message to backend:', error);
    }

    setShowAIMessageModal(false);
    setGeneratedMessage('');
  };

  if (selectedConversation) {
    return (
      <div className="flex flex-col h-full">
        {/* Conversation Header */}
        <div className="border-b border-gray-800/50 p-4 flex items-center gap-4">
          <button
            onClick={() => setSelectedConversation(null)}
            className="p-2 hover:bg-gray-900/60 rounded-lg transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          {!selectedConversation.isInternal ? (
            <button
              onClick={() => onSelectCandidate(selectedConversation.id)}
              className="flex items-center gap-3 flex-1 hover:bg-gray-900/40 rounded-lg p-2 -mx-2 transition-all group"
            >
              <img
                src={selectedConversation.avatar}
                alt={selectedConversation.name}
                className="w-10 h-10 rounded-full ring-2 ring-gray-800 group-hover:ring-blue-500/50 transition-all"
              />
              <div className="flex-1 text-left">
                <h3 className="font-semibold group-hover:text-blue-400 transition-colors">{selectedConversation.name}</h3>
                <p className="text-sm text-gray-400">{selectedConversation.role}</p>
              </div>
            </button>
          ) : (
            <>
              <img
                src={selectedConversation.avatar}
                alt={selectedConversation.name}
                className="w-10 h-10 rounded-full ring-2 ring-gray-800"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{selectedConversation.name}</h3>
                <p className="text-sm text-gray-400">{selectedConversation.coworkerTitle}</p>
              </div>
            </>
          )}
          <button className="p-2 hover:bg-gray-900/60 rounded-lg transition-all">
            <MoreVertical className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {selectedConversation.messages.map((message) => {
            const isRecruiter = message.senderId === 'recruiter';

            if (message.type === 'meeting' && message.meetingData) {
              return (
                <div key={message.id} className={`flex ${isRecruiter ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-md">
                    <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Calendar className="w-5 h-5 text-blue-400" />
                        <span className="text-blue-400">Meeting Scheduled</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{message.meetingData.date} at {message.meetingData.time}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {message.meetingData.type === 'video' ? (
                            <Video className="w-4 h-4 text-gray-400" />
                          ) : (
                            <Phone className="w-4 h-4 text-gray-400" />
                          )}
                          <span>{message.meetingData.duration} {message.meetingData.type} call</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-2">{message.timestamp}</p>
                  </div>
                </div>
              );
            }

            if (message.type === 'assessment' && message.assessmentData) {
              return (
                <div key={message.id} className={`flex ${isRecruiter ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-md">
                    <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <span className="text-purple-400">Assessment Sent</span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <p className="font-semibold">{message.assessmentData.title}</p>
                        <p className="text-gray-400">Status: <span className="text-yellow-400 capitalize">{message.assessmentData.status}</span></p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-2">{message.timestamp}</p>
                  </div>
                </div>
              );
            }

            if (message.type === 'feedback' && message.feedbackData) {
              return (
                <div key={message.id} className="flex justify-start">
                  <div className="max-w-md">
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-5 h-5 text-green-400" />
                        <span className="text-green-400">Candidate Feedback</span>
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={message.feedbackData.candidateAvatar}
                          alt={message.feedbackData.candidateName}
                          className="w-10 h-10 rounded-full ring-2 ring-gray-800"
                        />
                        <div>
                          <p className="font-semibold">{message.feedbackData.candidateName}</p>
                          <p className="text-xs text-gray-400">{message.feedbackData.candidateRole}</p>
                        </div>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400">Rating:</span>
                          <span className="text-yellow-400">{'★'.repeat(message.feedbackData.rating)}{'☆'.repeat(5 - message.feedbackData.rating)}</span>
                        </div>
                        <p className="text-gray-300">{message.feedbackData.recommendation}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-2">{message.timestamp}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={message.id} className={`flex ${isRecruiter ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-md">
                  <div
                    className={`px-4 py-3 rounded-2xl ${isRecruiter
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-900/60 border border-gray-800'
                      }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 px-2">{message.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Message Input */}
        <div className="border-t border-gray-800/50 p-4">
          {activeTab === 'candidates' && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setShowScheduleModal(true)}
                className="flex-1 px-3 py-2 bg-gray-900/60 hover:bg-gray-800 border border-gray-800 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                Schedule
              </button>
              <button
                onClick={() => setShowAssessmentModal(true)}
                className="flex-1 px-3 py-2 bg-gray-900/60 hover:bg-gray-800 border border-gray-800 rounded-lg text-sm transition-all flex items-center justify-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Assessment
              </button>
              <button
                onClick={() => handleGenerateAIMessage('initial')}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 rounded-lg text-sm transition-all flex items-center justify-center gap-2 text-blue-400"
              >
                <Sparkles className="w-4 h-4" />
                AI Message
              </button>
            </div>
          )}

          {activeTab === 'internal' && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setShowFeedbackModal(true)}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-lg text-sm transition-all flex items-center justify-center gap-2 text-green-400"
              >
                <MessageSquare className="w-4 h-4" />
                Send Feedback
              </button>
            </div>
          )}

          <div className="flex gap-2">
            <button className="p-3 hover:bg-gray-900/60 rounded-lg transition-all">
              <Paperclip className="w-5 h-5 text-gray-400" />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-3 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <button
              onClick={handleSendMessage}
              className="p-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-all"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Schedule Modal */}
        {showScheduleModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl">Schedule Meeting</h3>
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Date</label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time</label>
                  <input
                    type="time"
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Duration</label>
                  <select
                    value={meetingDuration}
                    onChange={(e) => setMeetingDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">1 hour</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Type</label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setMeetingType('video')}
                      className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${meetingType === 'video'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-900/50 border border-gray-800 hover:bg-gray-800'
                        }`}
                    >
                      <Video className="w-5 h-5" />
                      Video
                    </button>
                    <button
                      onClick={() => setMeetingType('phone')}
                      className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${meetingType === 'phone'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-900/50 border border-gray-800 hover:bg-gray-800'
                        }`}
                    >
                      <Phone className="w-5 h-5" />
                      Phone
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowScheduleModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleScheduleMeeting}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
                >
                  Send Invite
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Modal */}
        {showAssessmentModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl">Send Assessment</h3>
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Assessment Title</label>
                  <input
                    type="text"
                    value={assessmentTitle}
                    onChange={(e) => setAssessmentTitle(e.target.value)}
                    placeholder="e.g., React Component Architecture Challenge"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time Limit</label>
                  <select
                    value={assessmentTimeLimit}
                    onChange={(e) => setAssessmentTimeLimit(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="no-limit">No time limit</option>
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="3">3 hours</option>
                    <option value="24">24 hours</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAssessment}
                  className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors"
                >
                  Send Assessment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Feedback Modal */}
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl">Send Candidate Feedback</h3>
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Candidate</label>
                  <select
                    value={feedbackCandidate}
                    onChange={(e) => setFeedbackCandidate(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Select a candidate...</option>
                    <option value="priya">Priya Patel - Senior Frontend Engineer</option>
                    <option value="sophie">Sophie Turner - Backend Engineer</option>
                    <option value="alex">Alex Rivera - Backend Engineer</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Rating (1-5)</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setFeedbackRating(rating)}
                        className={`flex-1 px-4 py-3 rounded-xl transition-all ${rating <= feedbackRating
                            ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                            : 'bg-gray-900/50 border border-gray-800'
                          }`}
                      >
                        {rating}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Recommendation</label>
                  <textarea
                    value={feedbackRecommendation}
                    onChange={(e) => setFeedbackRecommendation(e.target.value)}
                    placeholder="Share your feedback and recommendation..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowFeedbackModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendFeedback}
                  className="flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 rounded-xl transition-colors"
                >
                  Send Feedback
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Message Modal */}
        {showAIMessageModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <h3 className="text-xl">AI-Generated Message</h3>
                </div>
                <button
                  onClick={() => {
                    setShowAIMessageModal(false);
                    setGeneratedMessage('');
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {aiGenerating ? (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                  <p className="text-gray-400">Generating personalized message...</p>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2">Generated Message (Editable)</label>
                    <textarea
                      value={generatedMessage}
                      onChange={(e) => setGeneratedMessage(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowAIMessageModal(false);
                        setGeneratedMessage('');
                      }}
                      className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={useAIMessage}
                      className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors"
                    >
                      Use This Message
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with Tabs */}
      <div className="sticky top-0 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl border-b border-gray-800/50 z-10">
        <div className="p-6 pb-0">
          <h1 className="text-2xl mb-4">Messages</h1>

          {/* Tabs */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => {
                setActiveTab('candidates');
                setSelectedConversation(null);
              }}
              className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'candidates'
                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
                }`}
            >
              <Briefcase className="w-5 h-5" />
              <span>Candidates</span>
              {!isLoadingCandidates && realCandidateConversations.filter(c => c.unread).length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                  {realCandidateConversations.filter(c => c.unread).length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('internal');
                setSelectedConversation(null);
              }}
              className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'internal'
                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
                }`}
            >
              <Users className="w-5 h-5" />
              <span>Internal</span>
              {internalConversations.filter(c => c.unread).length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                  {internalConversations.filter(c => c.unread).length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-6 pb-4">
          {activeTab === 'candidates' && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setSearchMode('conversations')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  searchMode === 'conversations'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-900/60 text-gray-400 border border-gray-800 hover:bg-gray-800'
                }`}
              >
                Conversations
              </button>
              <button
                onClick={() => setSearchMode('candidates')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  searchMode === 'candidates'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-900/60 text-gray-400 border border-gray-800 hover:bg-gray-800'
                }`}
              >
                All Candidates
              </button>
              <button
                onClick={() => setSearchMode('username')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs transition-all ${
                  searchMode === 'username'
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-900/60 text-gray-400 border border-gray-800 hover:bg-gray-800'
                }`}
              >
                By Username
              </button>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder={
                activeTab === 'internal'
                  ? 'Search coworkers...'
                  : searchMode === 'conversations'
                  ? 'Search conversations...'
                  : searchMode === 'candidates'
                  ? 'Search all candidates...'
                  : 'Search by @username...'
              }
              value={searchQuery}
              onChange={(e: any) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.map((conversation: any) => (
          <button
            key={conversation.id}
            onClick={() => {
              if (conversation.isSearchResult) {
                handleOpenCandidateConversation(conversation.id);
              } else {
                setSelectedConversation(conversation);
              }
            }}
            className="w-full p-4 border-b border-gray-800/50 hover:bg-gradient-to-r hover:from-gray-900/40 hover:to-transparent transition-all text-left group"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={conversation.avatar}
                  alt={conversation.name}
                  className="w-12 h-12 rounded-full ring-2 ring-gray-800/50 group-hover:ring-blue-500/30 transition-all"
                />
                {conversation.isInternal && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-2 border-black rounded-full flex items-center justify-center">
                    <Users className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold truncate">{conversation.name}</h3>
                  <span className="text-xs text-gray-500 flex-shrink-0">{conversation.timestamp}</span>
                </div>
                <p className="text-sm text-gray-400 truncate">{conversation.lastMessage}</p>
              </div>
              {conversation.unread && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
              )}
            </div>
          </button>
        ))}

        {filteredConversations.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-900/50 flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-gray-700" />
            </div>
            <h3 className="text-lg mb-2">No conversations found</h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {searchQuery
                ? 'Try a different search term'
                : `Start a conversation with ${activeTab === 'candidates' ? 'a candidate' : 'a coworker'}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
