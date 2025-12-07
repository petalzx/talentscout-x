import React, { useState, useEffect } from 'react';
import { Search, Send, Calendar, FileText, Paperclip, X, Clock, Video, Phone, MoreVertical, ChevronLeft, Sparkles, Wand2, Users, Briefcase, MessageSquare, User } from 'lucide-react';
import axios from 'axios';
import { USER_PERSONAS } from '../config/userPersonas';

const API_BASE = 'http://localhost:8000';

type MessageTab = 'candidates' | 'internal';

interface Message {
  id: string;
  senderId: string;
  senderType?: string; // 'recruiter', 'candidate', or 'internal'
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
  const [isSchedulingMeeting, setIsSchedulingMeeting] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showAIMessageModal, setShowAIMessageModal] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState('');
  const [showFeedbackRequestModal, setShowFeedbackRequestModal] = useState(false);
  const [feedbackRequestMessage, setFeedbackRequestMessage] = useState('');
  const [feedbackRequestTarget, setFeedbackRequestTarget] = useState<any>(null);

  // Real candidates state
  const [realCandidateConversations, setRealCandidateConversations] = useState<Conversation[]>([]);
  const [realInternalConversations, setRealInternalConversations] = useState<Conversation[]>([]);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(true);
  const [isLoadingInternal, setIsLoadingInternal] = useState(true);

  // All candidates from database (for candidate search mode)
  const [allCandidates, setAllCandidates] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Schedule meeting form
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingDuration, setMeetingDuration] = useState('30');
  const [meetingType, setMeetingType] = useState<'video' | 'phone'>('video');
  const [meetingInterviewer, setMeetingInterviewer] = useState('');

  // Assessment form
  const [assessmentTitle, setAssessmentTitle] = useState('');
  const [assessmentTimeLimit, setAssessmentTimeLimit] = useState('no-limit');
  const [assessmentTopic, setAssessmentTopic] = useState('');
  const [isGeneratingAssessment, setIsGeneratingAssessment] = useState(false);
  const [generatedAssessment, setGeneratedAssessment] = useState('');

  // Feedback form
  const [feedbackCandidate, setFeedbackCandidate] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(3);
  const [feedbackRecommendation, setFeedbackRecommendation] = useState('strong-yes');
  const [feedbackStage, setFeedbackStage] = useState('Round 1');
  const [feedbackTechnical, setFeedbackTechnical] = useState(3);
  const [feedbackCommunication, setFeedbackCommunication] = useState(3);
  const [feedbackCulture, setFeedbackCulture] = useState(3);
  const [feedbackComments, setFeedbackComments] = useState('');
  const [feedbackStrengths, setFeedbackStrengths] = useState('');
  const [feedbackConcerns, setFeedbackConcerns] = useState('');
  const [feedbackInterviewer, setFeedbackInterviewer] = useState('hiring-manager-1');

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

  // Function to reload internal conversations (grouped by coworker)
  const reloadInternalConversations = async () => {
    try {
      setIsLoadingInternal(true);

      // Get all candidates to fetch their messages
      const candidatesResponse = await axios.get(`${API_BASE}/candidates`);
      const candidates = candidatesResponse.data;

      // Collect all internal messages from all candidates
      const allInternalMessages: any[] = [];

      for (const candidate of candidates) {
        try {
          const messagesResponse = await axios.get(`${API_BASE}/candidates/${candidate.id}/messages`);
          const messages = messagesResponse.data;

          // Filter for internal messages and add candidate info
          const internalMsgs = messages
            .filter((msg: any) => msg.is_internal === true)
            .map((msg: any) => ({
              ...msg,
              candidateName: candidate.name,
              candidateHandle: candidate.handle,
            }));

          allInternalMessages.push(...internalMsgs);
        } catch (err) {
          // Skip candidates with errors
        }
      }

      // Group messages by sender_id (coworker)
      const messagesByCoworker = new Map<string, any[]>();

      for (const msg of allInternalMessages) {
        const senderId = msg.sender_id;
        if (!messagesByCoworker.has(senderId)) {
          messagesByCoworker.set(senderId, []);
        }
        messagesByCoworker.get(senderId)!.push(msg);
      }

      // Create conversations for each coworker
      const conversations: Conversation[] = [];

      for (const [senderId, messages] of messagesByCoworker.entries()) {
        // Find the coworker in USER_PERSONAS
        const coworker = USER_PERSONAS.find(p => p.id === senderId);

        if (!coworker) continue; // Skip if not found in personas

        // Sort messages by date
        messages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const lastMsg = messages[messages.length - 1];

        // Convert to Message format
        const formattedMessages: Message[] = messages.map((msg: any) => ({
          id: msg.id.toString(),
          senderId: msg.sender_id,
          senderType: msg.sender_type, // Include sender type for proper styling
          text: msg.content,
          timestamp: formatNotificationTime(msg.created_at),
          type: msg.message_type as 'text' | 'meeting' | 'assessment' | 'feedback',
        }));

        conversations.push({
          id: senderId, // Use coworker ID as conversation ID
          name: coworker.name.replace('You (', '').replace(')', ''),
          handle: `@${coworker.role.toLowerCase().replace(/\s+/g, '')}`,
          avatar: coworker.avatar,
          role: coworker.role,
          lastMessage: lastMsg.content.substring(0, 60) + '...',
          timestamp: formatNotificationTime(lastMsg.created_at),
          unread: false,
          isInternal: true,
          messages: formattedMessages,
        });
      }

      setRealInternalConversations(conversations);
    } catch (error) {
      console.error('Failed to load internal conversations:', error);
      setRealInternalConversations([]);
    } finally {
      setIsLoadingInternal(false);
    }
  };

  // Load internal conversations (conversations with coworkers)
  useEffect(() => {
    reloadInternalConversations();
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

      // Small delay to ensure state is properly set
      setTimeout(() => {
        setSelectedConversation(conversation);
        setActiveTab('candidates');
      }, 0);

      // Notify parent that conversation was opened (this clears the trigger)
      if (onConversationOpened) {
        console.log('Calling onConversationOpened callback');
        onConversationOpened();
      }
    };

    openOrCreateConversation();
  }, [openConversationId, realCandidateConversations, isLoadingCandidates, onConversationOpened]);

  // Load messages when conversation is selected
  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedConversation) return;

      // Skip loading for internal conversations - they already have their messages loaded
      if (selectedConversation.isInternal) {
        console.log('Skipping message load for internal conversation:', selectedConversation.name);
        return;
      }

      try {
        console.log('Loading messages for:', selectedConversation.name);
        const response = await axios.get(`${API_BASE}/candidates/${selectedConversation.id}/messages`);
        const apiMessages = response.data;

        console.log('Loaded messages:', apiMessages.length);

        if (apiMessages.length > 0) {
          // Filter out internal messages
          const externalMessages = apiMessages.filter((msg: any) => !msg.is_internal);

          const formattedMessages: Message[] = externalMessages.map((msg: any) => ({
            id: msg.id.toString(),
            senderId: msg.sender_type === 'recruiter' ? 'recruiter' : msg.candidate_id.toString(),
            text: msg.content,
            timestamp: formatTimestamp(msg.created_at),
            type: msg.message_type as 'text' | 'meeting' | 'assessment' | 'feedback',
          }));

          setSelectedConversation(prev => {
            if (!prev || String(prev.id) !== String(selectedConversation.id)) return prev;
            return { ...prev, messages: formattedMessages };
          });
        }
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadMessages();
  }, [selectedConversation?.id]); // Only run when conversation ID changes

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
    : (isLoadingInternal ? [] : realInternalConversations);

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
      // Exact username lookup
      // Remove @ if user included it
      const cleanQuery = query.startsWith('@') ? query.substring(1) : query;

      // Find exact match by handle
      const exactMatch = allCandidates.find((cand: any) =>
        cand.handle.toLowerCase() === cleanQuery.toLowerCase() ||
        cand.handle.toLowerCase() === `@${cleanQuery.toLowerCase()}`
      );

      if (exactMatch) {
        return [{
          id: exactMatch.id,
          name: exactMatch.name,
          handle: exactMatch.handle,
          avatar: exactMatch.avatar,
          role: exactMatch.roles?.[0] || 'Developer',
          lastMessage: exactMatch.bio?.substring(0, 60) + '...' || 'No bio',
          timestamp: '',
          unread: false,
          messages: [],
          isSearchResult: true,
        }];
      } else if (cleanQuery.length > 0) {
        // User has typed something but no match found - return empty with special marker
        return [];
      }
    }

    return currentConversations;
  };

  const filteredConversations = getFilteredResults();

  // Handle username lookup via Twitter API
  const handleUsernameLookup = async (username: string) => {
    const cleanQuery = username.startsWith('@') ? username.substring(1) : username;

    try {
      setSearchError(null);
      const response = await axios.get(`${API_BASE}/lookup/${cleanQuery}`);
      const candidate = response.data;

      // Add to allCandidates if not already there
      setAllCandidates(prev => {
        const exists = prev.find((c: any) => c.id === candidate.id);
        if (exists) return prev;
        return [...prev, candidate];
      });

      // Open conversation with the candidate
      const conversation: Conversation = {
        id: candidate.id,
        name: candidate.name,
        handle: candidate.handle,
        avatar: candidate.avatar,
        role: candidate.roles?.[0] || 'Developer',
        lastMessage: candidate.bio?.substring(0, 60) + '...' || 'No bio',
        timestamp: '',
        unread: false,
        messages: [],
        isSearchResult: true,
      };

      // Add to conversations list if not already there
      setRealCandidateConversations(prev => {
        const exists = prev.find(c => String(c.id) === String(candidate.id));
        if (exists) return prev;
        return [conversation, ...prev]; // Add to beginning of list
      });

      setSelectedConversation(conversation);
      onSelectCandidate(candidate.id);
      setSearchQuery(''); // Clear search after finding user

    } catch (error: any) {
      if (error.response?.status === 404) {
        setSearchError(`User @${cleanQuery} not found on Twitter`);
      } else {
        setSearchError(`Error looking up user: ${error.message}`);
      }
    }
  };


  const refreshMessages = async () => {
    if (!selectedConversation) return;

    try {
      let formattedMessages: Message[] = [];

      if (selectedConversation.isInternal) {
        // For internal conversations (grouped by coworker), we already have the messages
        // Just use what's in the conversation object
        formattedMessages = selectedConversation.messages || [];
      } else {
        // For candidate conversations, fetch from API
        const response = await axios.get(`${API_BASE}/candidates/${selectedConversation.id}/messages`);
        const apiMessages = response.data;

        // Filter out internal messages (only show external messages)
        const filteredMessages = apiMessages.filter((msg: any) => !msg.is_internal);

        // Transform API messages to UI format
        formattedMessages = filteredMessages.map((msg: any) => ({
          id: msg.id.toString(),
          senderId: msg.sender_type === 'recruiter' ? 'recruiter' : msg.candidate_id.toString(),
          text: msg.content,
          timestamp: formatTimestamp(msg.created_at),
          type: msg.message_type as 'text' | 'meeting' | 'assessment' | 'feedback',
        }));
      }

      // Update selected conversation with new messages
      setSelectedConversation((prev: Conversation | null) => {
        if (!prev) return prev;
        const lastMessage = formattedMessages[formattedMessages.length - 1];
        return {
          ...prev,
          messages: formattedMessages,
          lastMessage: lastMessage ? lastMessage.text.substring(0, 60) + '...' : prev.lastMessage,
          timestamp: lastMessage ? lastMessage.timestamp : prev.timestamp,
        };
      });

      // Update in the appropriate conversations list based on type
      if (selectedConversation.isInternal) {
        setRealInternalConversations((prev: Conversation[]) =>
          prev.map((conv: Conversation) => {
            if (String(conv.id) === String(selectedConversation.id)) {
              const lastMessage = formattedMessages[formattedMessages.length - 1];
              return {
                ...conv,
                messages: formattedMessages,
                lastMessage: lastMessage ? lastMessage.text.substring(0, 60) + '...' : conv.lastMessage,
                timestamp: lastMessage ? lastMessage.timestamp : conv.timestamp,
              };
            }
            return conv;
          })
        );
      } else {
        setRealCandidateConversations((prev: Conversation[]) =>
          prev.map((conv: Conversation) => {
            if (String(conv.id) === String(selectedConversation.id)) {
              const lastMessage = formattedMessages[formattedMessages.length - 1];
              return {
                ...conv,
                messages: formattedMessages,
                lastMessage: lastMessage ? lastMessage.text.substring(0, 60) + '...' : conv.lastMessage,
                timestamp: lastMessage ? lastMessage.timestamp : conv.timestamp,
              };
            }
            return conv;
          })
        );
      }

      console.log('Messages refreshed:', formattedMessages.length, 'isInternal:', selectedConversation.isInternal);
    } catch (error) {
      console.error('Failed to refresh messages:', error);
    }
  };

  const formatTimestamp = (isoString: string): string => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation) {
      console.log('Cannot send: missing text or conversation');
      return;
    }

    const messageContent = messageText.trim();
    console.log('Sending message:', messageContent);
    console.log('To candidate ID:', selectedConversation.id);
    console.log('Is internal conversation:', selectedConversation.isInternal);

    // Clear input immediately for better UX
    setMessageText('');

    try {
      // Send message to backend API
      const payload = {
        candidate_id: parseInt(selectedConversation.id),
        content: messageContent,
        sender_id: 'recruiter-1',
        sender_type: selectedConversation.isInternal ? 'internal' : 'recruiter',
        message_type: 'text',
        is_internal: selectedConversation.isInternal || false
      };

      console.log('Sending payload:', payload);

      const response = await axios.post(`${API_BASE}/messages`, payload);

      console.log('Message sent successfully:', response.data);

      // Immediately refresh to show your message
      await refreshMessages();

      // For external messages, wait a moment for AI response to be generated, then refresh again
      if (!selectedConversation.isInternal) {
        setTimeout(async () => {
          console.log('Refreshing messages to get AI response...');
          await refreshMessages();
        }, 3000); // 3 second delay to allow AI to respond
      }

    } catch (error: any) {
      console.error('Failed to send message:', error);
      console.error('Error details:', error.response?.data || error.message);
    }
  };

  const handleScheduleMeeting = async () => {
    if (!meetingDate || !meetingTime || !selectedConversation || !meetingInterviewer) {
      alert('Please fill in all meeting details and select an interviewer');
      return;
    }

    // Prevent multiple submissions
    if (isSchedulingMeeting) {
      console.log('Already scheduling meeting, ignoring duplicate click');
      return;
    }

    setIsSchedulingMeeting(true);

    try {
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

      // Save to backend with interviewer assignment
      console.log('Creating event with interviewer:', meetingInterviewer);
      const eventResponse = await axios.post(`${API_BASE}/events`, {
        candidate_id: parseInt(selectedConversation.id),
        title: 'Interview Meeting',
        description: `${meetingType} interview`,
        event_type: 'meeting',
        scheduled_at: `${meetingDate}T${meetingTime}:00`,
        duration: parseInt(meetingDuration),
        meeting_type: meetingType,
        meeting_link: meetingType === 'video' ? 'Google Meet' : null,
        notes: null,
        assigned_interviewer_id: meetingInterviewer
      });

      console.log('Event created:', eventResponse.data);

      // Get interviewer info for notifications
      const interviewer = USER_PERSONAS.find(p => p.id === meetingInterviewer);
      const interviewerName = interviewer?.name.replace('You (', '').replace(')', '') || 'Team Member';
      const candidateName = selectedConversation.name || 'Candidate';
      const meetingDateFormatted = new Date(meetingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      // Send notification message to the candidate (in their message thread)
      const candidateMessageResponse = await axios.post(`${API_BASE}/messages`, {
        candidate_id: parseInt(selectedConversation.id),
        sender_id: 'recruiter-1',
        sender_type: 'recruiter',
        message_type: 'text',
        content: `Your interview with ${interviewerName} has been scheduled for ${meetingDateFormatted} at ${meetingTime} (${meetingDuration} min ${meetingType} call). We look forward to speaking with you!`
      });

      console.log('Candidate notification sent:', candidateMessageResponse.data);

      // Send internal notification to the interviewer
      // For internal messages, sender_id should be the interviewer's ID (who we're messaging)
      // Use sender_type: 'recruiter' so it displays as "sent by you" (blue)
      const internalMessageResponse = await axios.post(`${API_BASE}/messages`, {
        candidate_id: parseInt(selectedConversation.id),
        sender_id: meetingInterviewer, // Use interviewer ID as sender for grouping
        sender_type: 'recruiter',
        message_type: 'text',
        content: `@${interviewerName}: You've been assigned to interview ${candidateName} on ${meetingDateFormatted} at ${meetingTime} (${meetingDuration} min ${meetingType} call). Please review their profile and prepare feedback after the interview.`,
        is_internal: true
      });

      console.log('Internal notification sent:', internalMessageResponse.data);

      // Refresh messages to show the new notifications
      if (selectedConversation) {
        await refreshMessages();
      }

      // Reload internal conversations to show the new internal notification
      await reloadInternalConversations();

      // Close modal and reset form
      setShowScheduleModal(false);
      setMeetingDate('');
      setMeetingTime('');
      setMeetingDuration('30');
      setMeetingType('video');
      setMeetingInterviewer('');

    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      alert('Failed to schedule meeting. Please try again.');
    } finally {
      setIsSchedulingMeeting(false);
    }
  };

  const handleGenerateAssessment = async () => {
    if (!assessmentTopic.trim()) {
      alert('Please select or enter a topic');
      return;
    }

    setIsGeneratingAssessment(true);

    // Simulate AI generation with a delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Generate assessment based on topic and candidate role
    const role = selectedConversation?.role || 'Developer';
    const assessments: Record<string, any> = {
      'React': {
        title: 'React Component Architecture Challenge',
        description: `Build a reusable component library with the following requirements:

1. Create a customizable Card component with variants (default, outlined, elevated)
2. Implement a DataTable component with sorting, filtering, and pagination
3. Build a Form component with validation using React Hook Form
4. Add proper TypeScript types for all components
5. Include Storybook documentation for each component

Requirements:
- Use React 18+ with TypeScript
- Implement proper error boundaries
- Add comprehensive unit tests (Jest + React Testing Library)
- Follow accessibility best practices (ARIA labels, keyboard navigation)
- Use CSS-in-JS or Tailwind for styling

Deliverables:
- GitHub repository with clean commit history
- README with setup instructions
- Live demo deployed to Vercel/Netlify`,
      },
      'TypeScript': {
        title: 'TypeScript Advanced Types Challenge',
        description: `Create a type-safe API client library:

1. Design a generic HTTP client with proper TypeScript types
2. Implement request/response interceptors with type safety
3. Create type-safe query builders for REST endpoints
4. Add compile-time validation for API schemas
5. Implement proper error handling with discriminated unions

Requirements:
- Use advanced TypeScript features (conditional types, mapped types, template literals)
- Provide full IntelliSense support
- Handle all edge cases with proper type narrowing
- Include comprehensive type tests

Deliverables:
- NPM-ready package
- API documentation
- Example usage with different scenarios`,
      },
      'Node.js': {
        title: 'Node.js Microservice Architecture',
        description: `Build a scalable microservice system:

1. Create 3 microservices (Auth, Users, Orders) with RESTful APIs
2. Implement inter-service communication (REST + message queue)
3. Add database integration (PostgreSQL) with migrations
4. Implement JWT authentication and authorization
5. Add logging, monitoring, and error handling

Requirements:
- Use Express.js or Fastify
- Docker containerization for each service
- Redis for caching and sessions
- RabbitMQ or Kafka for async messaging
- Proper API documentation (OpenAPI/Swagger)

Deliverables:
- Docker Compose setup for local development
- API documentation
- Postman collection for testing`,
      },
      'System Design': {
        title: 'Design a Scalable URL Shortener',
        description: `Design and implement a URL shortening service:

1. System Design:
   - Handle 1000 writes/sec and 10000 reads/sec
   - Design database schema (SQL or NoSQL)
   - Plan caching strategy
   - Design for high availability

2. Implementation:
   - Build REST API with rate limiting
   - Implement custom short URL generation algorithm
   - Add analytics tracking (click counts, referrers)
   - Handle concurrent requests safely

3. Bonus:
   - QR code generation
   - Custom alias support
   - Link expiration

Deliverables:
- Architecture diagram
- Working implementation
- Load testing results`,
      },
      'Python': {
        title: 'Python Data Processing Pipeline',
        description: `Build a data processing pipeline:

1. Create ETL pipeline to process large CSV files (1M+ rows)
2. Implement data validation and cleaning
3. Add transformations (aggregations, joins, filtering)
4. Store results in PostgreSQL database
5. Create REST API to query processed data

Requirements:
- Use Pandas for data processing
- FastAPI for the REST API
- SQLAlchemy for database ORM
- Add proper error handling and logging
- Implement async processing for large files

Deliverables:
- Pipeline code with documentation
- API endpoints with Swagger docs
- Sample data and test cases`,
      },
      'DevOps': {
        title: 'CI/CD Pipeline Implementation',
        description: `Set up a complete CI/CD pipeline:

1. Create GitHub Actions workflow for:
   - Automated testing
   - Code quality checks (linting, security scanning)
   - Docker image building
   - Deployment to staging/production

2. Infrastructure as Code:
   - Terraform scripts for AWS infrastructure
   - Kubernetes manifests for container orchestration
   - Helm charts for application deployment

3. Monitoring & Logging:
   - Prometheus metrics
   - Grafana dashboards
   - Centralized logging (ELK stack)

Deliverables:
- Complete workflow files
- Infrastructure code
- Documentation for setup and usage`,
      },
    };

    const selectedAssessment = assessments[assessmentTopic] || {
      title: `${assessmentTopic} Technical Challenge`,
      description: `Create a comprehensive technical challenge focusing on ${assessmentTopic}.

Requirements:
1. Demonstrate proficiency in ${assessmentTopic}
2. Follow best practices and design patterns
3. Include proper documentation
4. Add tests and error handling
5. Deploy a working demo

Time limit: ${assessmentTimeLimit === 'no-limit' ? 'No time limit' : `${assessmentTimeLimit} hours`}

Deliverables:
- Source code in GitHub repository
- README with setup instructions
- Live demo (if applicable)
- Documentation of design decisions`,
    };

    setAssessmentTitle(selectedAssessment.title);
    setGeneratedAssessment(selectedAssessment.description);
    setIsGeneratingAssessment(false);
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
      const fullMessage = generatedAssessment
        ? `Assessment sent: ${assessmentTitle}\n\nTime limit: ${assessmentTimeLimit === 'no-limit' ? 'No limit' : assessmentTimeLimit + ' hours'}\n\n${generatedAssessment}`
        : `Assessment sent: ${assessmentTitle} (Time limit: ${assessmentTimeLimit === 'no-limit' ? 'No limit' : assessmentTimeLimit + ' hours'})`;

      await axios.post(`${API_BASE}/notifications`, {
        candidate_id: parseInt(selectedConversation.id),
        message: fullMessage,
        event_type: 'assessment_sent',
        from_stage: null,
        to_stage: null,
        is_ai_generated: generatedAssessment ? true : false,
      });
    } catch (error) {
      console.error('Failed to save assessment to backend:', error);
    }

    setShowAssessmentModal(false);
    setAssessmentTitle('');
    setAssessmentTopic('');
    setAssessmentTimeLimit('no-limit');
    setGeneratedAssessment('');
  };

  const handleSendFeedback = async () => {
    if (!feedbackCandidate || !feedbackComments.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Parse strengths and concerns from comma-separated strings
      const strengths = feedbackStrengths.split(',').map(s => s.trim()).filter(Boolean);
      const concerns = feedbackConcerns.split(',').map(s => s.trim()).filter(Boolean);

      // Use the selected conversation's interviewer ID if it's an internal conversation
      const interviewerId = selectedConversation?.isInternal
        ? selectedConversation.id
        : feedbackInterviewer;

      const payload = {
        candidate_id: parseInt(feedbackCandidate),
        interviewer_id: interviewerId,
        stage: feedbackStage,
        rating: feedbackRating,
        recommendation: feedbackRecommendation,
        technical_skills: feedbackTechnical,
        communication: feedbackCommunication,
        culture_fit: feedbackCulture,
        comments: feedbackComments,
        strengths,
        concerns
      };

      console.log('Submitting feedback:', payload);

      await axios.post(`${API_BASE}/feedback/submit-as-message`, payload);

      // If this is from an internal conversation, also send a reply message
      if (selectedConversation?.isInternal) {
        const candidate = allCandidates.find(c => c.id === parseInt(feedbackCandidate));
        const feedbackSummary = `Feedback submitted for ${candidate?.name || 'candidate'}: ${feedbackRecommendation.replace('-', ' ')} (${feedbackRating}/5 stars). ${feedbackComments.substring(0, 100)}...`;

        await axios.post(`${API_BASE}/messages`, {
          candidate_id: parseInt(feedbackCandidate),
          content: feedbackSummary,
          sender_id: interviewerId,
          sender_type: 'internal',
          message_type: 'text',
          is_internal: true
        });

        // Add message to current conversation
        const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: interviewerId,
          text: feedbackSummary,
          timestamp: 'Just now',
          type: 'text',
        };

        setSelectedConversation(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            messages: [...prev.messages, newMessage],
            lastMessage: feedbackSummary.substring(0, 60) + '...',
            timestamp: 'Just now',
          };
        });

        // Reload internal conversations
        await reloadInternalConversations();
      }

      // Reset form
      setShowFeedbackModal(false);
      setFeedbackCandidate('');
      setFeedbackRating(3);
      setFeedbackRecommendation('strong-yes');
      setFeedbackStage('Round 1');
      setFeedbackTechnical(3);
      setFeedbackCommunication(3);
      setFeedbackCulture(3);
      setFeedbackComments('');
      setFeedbackStrengths('');
      setFeedbackConcerns('');

      // Refresh messages to show the new feedback
      if (selectedConversation && !selectedConversation.isInternal) {
        await refreshMessages();
      }

      alert('Feedback submitted successfully!');
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      alert('Failed to submit feedback. Please try again.');
    }
  };

  const handleRequestFeedback = async () => {
    if (!selectedConversation) return;

    try {
      // Get all candidates that this interviewer was assigned to
      const candidatesResponse = await axios.get(`${API_BASE}/candidates`);
      const allCandidates = candidatesResponse.data;

      // Find events where this interviewer was assigned
      const interviewerId = selectedConversation.id; // This is the coworker ID
      const candidatesWithInterviews: any[] = [];

      for (const candidate of allCandidates) {
        try {
          const eventsResponse = await axios.get(`${API_BASE}/candidates/${candidate.id}/events`);
          const events = eventsResponse.data;

          // Check if this interviewer was assigned to any events for this candidate
          const hasAssignedEvents = events.some((event: any) => event.assigned_interviewer_id === interviewerId);

          if (hasAssignedEvents) {
            candidatesWithInterviews.push(candidate);
          }
        } catch (err) {
          // Skip candidates with errors
        }
      }

      // Generate feedback request message
      let feedbackMessage = '';
      const interviewerName = selectedConversation.name;

      if (candidatesWithInterviews.length === 0) {
        feedbackMessage = `Hi ${interviewerName}, could you provide feedback on any recent interviews you've conducted? Your insights would be valuable for our hiring process.`;
      } else if (candidatesWithInterviews.length === 1) {
        const candidate = candidatesWithInterviews[0];
        feedbackMessage = `Hi ${interviewerName}, could you please provide feedback on your interview with ${candidate.name}? We'd love to hear your thoughts on their technical skills, communication, and overall fit for the role.`;
      } else {
        const candidateNames = candidatesWithInterviews.map(c => c.name).join(', ');
        feedbackMessage = `Hi ${interviewerName}, could you please provide feedback on your recent interviews with ${candidateNames}? Your insights on their technical skills, communication, and cultural fit would be very helpful.`;
      }

      // Store the message and target for confirmation
      const targetCandidateId = candidatesWithInterviews.length > 0
        ? candidatesWithInterviews[0].id
        : allCandidates[0]?.id;

      setFeedbackRequestMessage(feedbackMessage);
      setFeedbackRequestTarget({
        candidateId: targetCandidateId,
        candidates: candidatesWithInterviews
      });
      setShowFeedbackRequestModal(true);

    } catch (error) {
      console.error('Failed to generate feedback request:', error);
      alert('Failed to generate feedback request. Please try again.');
    }
  };

  const confirmSendFeedbackRequest = async () => {
    if (!feedbackRequestTarget?.candidateId || !selectedConversation) return;

    try {
      // Send the feedback request
      // For internal messages, sender_id should be the internal member's ID (who we're messaging)
      // Use sender_type: 'recruiter' so it displays as "sent by you" (blue)
      await axios.post(`${API_BASE}/messages`, {
        candidate_id: parseInt(feedbackRequestTarget.candidateId),
        content: feedbackRequestMessage,
        sender_id: selectedConversation.id, // Use the internal member's ID
        sender_type: 'recruiter',
        message_type: 'text',
        is_internal: true
      });

      // Add the request message to the current conversation
      const requestMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: 'recruiter',
        senderType: 'recruiter', // Mark as from recruiter for blue styling
        text: feedbackRequestMessage,
        timestamp: 'Just now',
        type: 'text',
      };

      setSelectedConversation(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: [...prev.messages, requestMessage],
          lastMessage: feedbackRequestMessage.substring(0, 60) + '...',
          timestamp: 'Just now',
        };
      });

      setShowFeedbackRequestModal(false);
      setFeedbackRequestMessage('');

      // Auto-generate feedback response after 2-3 seconds
      const delay = Math.random() * 1000 + 2000; // 2-3 seconds
      setTimeout(async () => {
        try {
          // Re-fetch candidates to get the most up-to-date interview assignments
          const candidatesResponse = await axios.get(`${API_BASE}/candidates`);
          const allCandidates = candidatesResponse.data;
          const interviewerId = selectedConversation.id;

          const candidatesWithInterviews: any[] = [];
          console.log('Looking for interviews assigned to:', interviewerId);

          for (const candidate of allCandidates) {
            try {
              const eventsResponse = await axios.get(`${API_BASE}/candidates/${candidate.id}/events`);
              const events = eventsResponse.data;

              if (events.length > 0) {
                console.log(`Candidate ${candidate.name} has ${events.length} event(s):`, events.map((e: any) => ({
                  title: e.title,
                  assigned_interviewer_id: e.assigned_interviewer_id,
                  type: typeof e.assigned_interviewer_id
                })));
              }

              // Check if this interviewer was assigned to any events for this candidate
              const hasAssignedEvents = events.some((event: any) => event.assigned_interviewer_id === interviewerId);

              if (hasAssignedEvents) {
                console.log(`Found match! ${candidate.name} was interviewed by ${interviewerId}`);
                candidatesWithInterviews.push(candidate);
              }
            } catch (err) {
              // Skip candidates with errors
            }
          }

          console.log('Total candidates with interviews:', candidatesWithInterviews.length);

          if (candidatesWithInterviews.length === 0) {
            // No candidates assigned - send a "no feedback" response
            const noFeedbackMessage = `I haven't conducted any interviews recently that need feedback. Let me know if there are any specific candidates you'd like me to review!`;

            await axios.post(`${API_BASE}/messages`, {
              candidate_id: parseInt(feedbackRequestTarget.candidateId),
              content: noFeedbackMessage,
              sender_id: interviewerId,
              sender_type: 'internal',
              message_type: 'text',
              is_internal: true
            });

            // Add to UI immediately
            setSelectedConversation(prev => {
              if (!prev || prev.id !== interviewerId) return prev;

              const newMsg: Message = {
                id: `msg-${Date.now()}`,
                senderId: interviewerId,
                senderType: 'internal', // Mark as from internal member (gray)
                text: noFeedbackMessage,
                timestamp: 'Just now',
                type: 'text',
              };

              return {
                ...prev,
                messages: [...prev.messages, newMsg],
                lastMessage: noFeedbackMessage.substring(0, 60) + '...',
                timestamp: 'Just now',
              };
            });

          } else {
            // Has candidates - generate feedback for each
            const feedbackMessages: Message[] = [];

            for (const candidate of candidatesWithInterviews) {
              const feedbackRating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
              const recommendations = ['strong-yes', 'yes', 'strong-yes'];
              const recommendation = recommendations[Math.floor(Math.random() * recommendations.length)];

              const feedbackTemplates = [
                `I had a great interview with ${candidate.name}. They demonstrated strong technical skills and excellent communication. Their approach to problem-solving was methodical and they asked insightful questions. I'd recommend moving forward.`,
                `${candidate.name} showed solid understanding of the role requirements. They have good experience and seem like they'd fit well with the team culture. Definitely worth progressing to the next round.`,
                `Really impressed with ${candidate.name}'s technical depth and passion for the work. They have relevant experience and I think they'd be a strong addition to the team. Strong yes from me.`,
                `${candidate.name} did well in the interview. Good technical foundation and clear communication style. They seem motivated and eager to learn. I'd recommend proceeding.`
              ];

              const feedbackComment = feedbackTemplates[Math.floor(Math.random() * feedbackTemplates.length)];
              const feedbackSummary = `Feedback for ${candidate.name}: ${recommendation.replace('-', ' ')} (${feedbackRating}/5 ⭐)\n\n${feedbackComment}`;

              // Submit the actual feedback to backend
              await axios.post(`${API_BASE}/feedback/submit-as-message`, {
                candidate_id: candidate.id,
                interviewer_id: interviewerId,
                stage: 'Round 1',
                rating: feedbackRating,
                recommendation: recommendation,
                technical_skills: feedbackRating,
                communication: feedbackRating,
                culture_fit: feedbackRating,
                comments: feedbackComment,
                strengths: ['Technical skills', 'Communication', 'Problem solving'],
                concerns: []
              });

              // Send feedback as internal message
              await axios.post(`${API_BASE}/messages`, {
                candidate_id: candidate.id,
                content: feedbackSummary,
                sender_id: interviewerId,
                sender_type: 'internal',
                message_type: 'text',
                is_internal: true
              });

              // Add to UI messages array
              feedbackMessages.push({
                id: `feedback-${candidate.id}-${Date.now()}`,
                senderId: interviewerId,
                senderType: 'internal', // Mark as from internal member (gray)
                text: feedbackSummary,
                timestamp: 'Just now',
                type: 'text',
              });
            }

            // Update conversation with all feedback messages
            setSelectedConversation(prev => {
              if (!prev || prev.id !== interviewerId) return prev;

              return {
                ...prev,
                messages: [...prev.messages, ...feedbackMessages],
                lastMessage: feedbackMessages[feedbackMessages.length - 1]?.text.substring(0, 60) + '...',
                timestamp: 'Just now',
              };
            });
          }

          console.log('Auto-feedback generated successfully');

        } catch (error) {
          console.error('Failed to auto-generate feedback:', error);
        }
      }, delay);

      setFeedbackRequestTarget(null);
      alert('Feedback request sent! The interviewer will respond shortly.');

    } catch (error) {
      console.error('Failed to send feedback request:', error);
      alert('Failed to send feedback request. Please try again.');
    }
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
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {selectedConversation.messages.map((message) => {
            // For internal conversations, check senderType. For regular, check senderId
            const isRecruiter = selectedConversation.isInternal
              ? message.senderType === 'recruiter'
              : message.senderId === 'recruiter';

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

          {activeTab === 'internal' && selectedConversation && (
            <div className="flex gap-2 mb-3">
              <button
                onClick={() => handleRequestFeedback()}
                className="flex-1 px-3 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-500/30 rounded-lg text-sm transition-all flex items-center justify-center gap-2 text-green-400"
              >
                <MessageSquare className="w-4 h-4" />
                Request Feedback
              </button>
            </div>
          )}

          {selectedConversation?.isInternal ? (
            // Read-only for internal conversations
            <div className="flex items-center justify-center py-4 px-6 bg-gray-900/40 border border-gray-800 rounded-xl">
              <p className="text-sm text-gray-500">
                Internal conversation with {selectedConversation.name}. Feedback requests are auto-responded.
              </p>
            </div>
          ) : (
            // Regular message input for candidate conversations
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
          )}
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
                  <label className="block text-sm text-gray-400 mb-2">
                    <User className="inline w-4 h-4 mr-1" />
                    Assign Interviewer
                  </label>
                  <select
                    value={meetingInterviewer}
                    onChange={(e) => setMeetingInterviewer(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Select interviewer...</option>
                    {USER_PERSONAS.map((persona) => (
                      <option key={persona.id} value={persona.id}>
                        {persona.name.replace('You (', '').replace(')', '')} - {persona.role}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-2">
                    This interviewer will be assigned to provide feedback after the meeting
                  </p>
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
                  disabled={!meetingDate || !meetingTime || !meetingInterviewer || isSchedulingMeeting}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSchedulingMeeting ? 'Scheduling...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assessment Modal */}
        {showAssessmentModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl">Send Assessment</h3>
                <button
                  onClick={() => {
                    setShowAssessmentModal(false);
                    setAssessmentTitle('');
                    setAssessmentTopic('');
                    setGeneratedAssessment('');
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Topic</label>
                  <select
                    value={assessmentTopic}
                    onChange={(e: any) => setAssessmentTopic(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">Select a topic...</option>
                    <option value="React">React</option>
                    <option value="TypeScript">TypeScript</option>
                    <option value="Node.js">Node.js</option>
                    <option value="Python">Python</option>
                    <option value="System Design">System Design</option>
                    <option value="DevOps">DevOps</option>
                    <option value="AWS">AWS</option>
                    <option value="Kubernetes">Kubernetes</option>
                    <option value="Data Structures">Data Structures & Algorithms</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Time Limit</label>
                  <select
                    value={assessmentTimeLimit}
                    onChange={(e: any) => setAssessmentTimeLimit(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="no-limit">No time limit</option>
                    <option value="1">1 hour</option>
                    <option value="2">2 hours</option>
                    <option value="3">3 hours</option>
                    <option value="4">4 hours</option>
                    <option value="24">24 hours</option>
                    <option value="48">48 hours</option>
                    <option value="72">72 hours (3 days)</option>
                    <option value="168">1 week</option>
                  </select>
                </div>

                {assessmentTopic && (
                  <button
                    onClick={handleGenerateAssessment}
                    disabled={isGeneratingAssessment}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 rounded-xl transition-all flex items-center justify-center gap-2 text-blue-400 disabled:opacity-50"
                  >
                    {isGeneratingAssessment ? (
                      <>
                        <Sparkles className="w-5 h-5 animate-pulse" />
                        Generating Assessment...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate with AI
                      </>
                    )}
                  </button>
                )}

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Assessment Title</label>
                  <input
                    type="text"
                    value={assessmentTitle}
                    onChange={(e: any) => setAssessmentTitle(e.target.value)}
                    placeholder="e.g., React Component Architecture Challenge"
                    className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                {generatedAssessment && (
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Assessment Details (Editable)</label>
                    <textarea
                      value={generatedAssessment}
                      onChange={(e: any) => setGeneratedAssessment(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm font-mono"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowAssessmentModal(false);
                    setAssessmentTitle('');
                    setAssessmentTopic('');
                    setGeneratedAssessment('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendAssessment}
                  disabled={!assessmentTitle.trim()}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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

              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Candidate *</label>
                    <select
                      value={feedbackCandidate}
                      onChange={(e) => setFeedbackCandidate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="">Select candidate...</option>
                      {realCandidateConversations.map((c: any) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Interview Stage *</label>
                    <select
                      value={feedbackStage}
                      onChange={(e) => setFeedbackStage(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <option value="Screening">Screening</option>
                      <option value="Round 1">Round 1</option>
                      <option value="Round 2">Round 2</option>
                      <option value="Final">Final</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Overall Rating (1-5) *</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        key={rating}
                        type="button"
                        onClick={() => setFeedbackRating(rating)}
                        className={`flex-1 px-3 py-2 rounded-lg text-sm transition-all ${
                          rating <= feedbackRating
                            ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400'
                            : 'bg-gray-900/50 border border-gray-800 text-gray-500'
                        }`}
                      >
                        {rating}⭐
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Recommendation *</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: 'strong-yes', label: 'Strong Yes', color: 'green' },
                      { value: 'yes', label: 'Yes', color: 'blue' },
                      { value: 'maybe', label: 'Maybe', color: 'yellow' },
                      { value: 'no', label: 'No', color: 'orange' },
                      { value: 'strong-no', label: 'Strong No', color: 'red' }
                    ].map((rec) => (
                      <button
                        key={rec.value}
                        type="button"
                        onClick={() => setFeedbackRecommendation(rec.value)}
                        className={`px-3 py-2 rounded-lg text-xs transition-all ${
                          feedbackRecommendation === rec.value
                            ? `bg-${rec.color}-500/20 border border-${rec.color}-500/30 text-${rec.color}-400`
                            : 'bg-gray-900/50 border border-gray-800 text-gray-500'
                        }`}
                      >
                        {rec.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Technical Skills *</label>
                    <select
                      value={feedbackTechnical}
                      onChange={(e) => setFeedbackTechnical(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}/5</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Communication *</label>
                    <select
                      value={feedbackCommunication}
                      onChange={(e) => setFeedbackCommunication(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}/5</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Culture Fit *</label>
                    <select
                      value={feedbackCulture}
                      onChange={(e) => setFeedbackCulture(parseInt(e.target.value))}
                      className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}/5</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Interview Comments *</label>
                  <textarea
                    value={feedbackComments}
                    onChange={(e) => setFeedbackComments(e.target.value)}
                    placeholder="Share detailed feedback about the interview..."
                    rows={4}
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Strengths (comma-separated)</label>
                  <input
                    type="text"
                    value={feedbackStrengths}
                    onChange={(e) => setFeedbackStrengths(e.target.value)}
                    placeholder="e.g. Strong React knowledge, Good problem solver"
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-2">Concerns (comma-separated)</label>
                  <input
                    type="text"
                    value={feedbackConcerns}
                    onChange={(e) => setFeedbackConcerns(e.target.value)}
                    placeholder="e.g. Limited system design experience, Needs more depth"
                    className="w-full px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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

        {/* Feedback Request Confirmation Modal */}
        {showFeedbackRequestModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl">Confirm Feedback Request</h3>
                <button
                  onClick={() => {
                    setShowFeedbackRequestModal(false);
                    setFeedbackRequestMessage('');
                    setFeedbackRequestTarget(null);
                  }}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-gray-400 mb-3">You're about to send this feedback request:</p>
                <div className="bg-gray-950 border border-gray-800 rounded-xl p-4">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{feedbackRequestMessage}</p>
                </div>
                {feedbackRequestTarget?.candidates && feedbackRequestTarget.candidates.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-2">Requesting feedback for:</p>
                    <div className="flex flex-wrap gap-2">
                      {feedbackRequestTarget.candidates.map((candidate: any) => (
                        <span key={candidate.id} className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-lg border border-blue-500/30">
                          {candidate.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowFeedbackRequestModal(false);
                    setFeedbackRequestMessage('');
                    setFeedbackRequestTarget(null);
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSendFeedbackRequest}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors"
                >
                  Send Request
                </button>
              </div>
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
          <div className="relative flex gap-2">
            <div className="relative flex-1">
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
                    : 'Enter @username and press Enter or click Lookup'
                }
                value={searchQuery}
                onChange={(e: any) => setSearchQuery(e.target.value)}
                onKeyPress={(e: any) => {
                  if (e.key === 'Enter' && searchMode === 'username' && searchQuery.trim()) {
                    handleUsernameLookup(searchQuery);
                  }
                }}
                className="w-full pl-12 pr-4 py-3 bg-gray-900/60 border border-gray-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            {searchMode === 'username' && searchQuery.trim() && (
              <button
                onClick={() => handleUsernameLookup(searchQuery)}
                className="px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Lookup
              </button>
            )}
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
            <h3 className="text-lg mb-2">
              {searchError || 'No conversations found'}
            </h3>
            <p className="text-sm text-gray-500 max-w-sm">
              {searchError
                ? 'The user handle you searched for does not exist in our database'
                : searchQuery
                ? 'Try a different search term'
                : `Start a conversation with ${activeTab === 'candidates' ? 'a candidate' : 'a coworker'}`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
