import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, ChevronUp, ArrowRight, X, Send, Sparkles } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';

interface PipelineProps {
  onSelectCandidate: (id: string) => void;
}

const API_BASE = 'http://localhost:8000';

interface Candidate {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
  match: number;
}

interface PipelineData {
  [key: string]: {
    Qualified: Candidate[];
    Screening: Candidate[];
    'Round 1': Candidate[];
    'Round 2': Candidate[];
    Final: Candidate[];
    Offer: Candidate[];
    Rejected: Candidate[];
  };
}

// Function to organize candidates by their actual pipeline stages from the database
// Only includes candidates who have been moved to Qualified or beyond (excludes "Discovered")
const distributeCandidates = (candidates: any[]): PipelineData => {
  const result: PipelineData = {
    all: {
      Qualified: [],
      Screening: [],
      'Round 1': [],
      'Round 2': [],
      Final: [],
      Offer: [],
      Rejected: [],
    },
    'Senior Frontend Engineer': {
      Qualified: [],
      Screening: [],
      'Round 1': [],
      'Round 2': [],
      Final: [],
      Offer: [],
      Rejected: [],
    },
    'Backend Engineer': {
      Qualified: [],
      Screening: [],
      'Round 1': [],
      'Round 2': [],
      Final: [],
      Offer: [],
      Rejected: [],
    },
    'ML Engineer': {
      Qualified: [],
      Screening: [],
      'Round 1': [],
      'Round 2': [],
      Final: [],
      Offer: [],
      Rejected: [],
    },
    'DevOps Engineer': {
      Qualified: [],
      Screening: [],
      'Round 1': [],
      'Round 2': [],
      Final: [],
      Offer: [],
      Rejected: [],
    },
  };

  // Transform candidates to match pipeline format
  const transformedCandidates = candidates.map(candidate => ({
    id: candidate.id,
    name: candidate.name,
    handle: candidate.handle,
    avatar: candidate.avatar,
    role: candidate.roles?.[0] || 'Developer',
    match: candidate.match,
    pipeline_stage: candidate.pipeline_stage,
  }));

  // Organize candidates by their actual pipeline stage from the database
  // Only include candidates in "Qualified" or later stages (skip "Discovered")
  transformedCandidates.forEach(candidate => {
    const stage = candidate.pipeline_stage;

    // Only add candidates who are in Qualified or beyond (skip null and "Discovered")
    if (stage && stage !== 'Discovered' && result.all[stage as keyof typeof result.all]) {
      // Add to all category
      result.all[stage as keyof typeof result.all].push(candidate);

      // Add to role-specific category
      const roleKey = candidate.role;
      if (result[roleKey]) {
        result[roleKey][stage as keyof typeof result[roleKey]].push(candidate);
      }
    }
  });

  return result;
};

const stageOrder = ['Qualified', 'Screening', 'Round 1', 'Round 2', 'Final', 'Offer', 'Rejected'];

interface SwipeableCardProps {
  candidate: Candidate;
  currentStage: string;
  onSelectCandidate: (id: string) => void;
  onMoveToNextStage: (candidate: Candidate, currentStage: string) => void;
  onReject: (candidate: Candidate, currentStage: string) => void;
}

function SwipeableCard({ candidate, currentStage, onSelectCandidate, onMoveToNextStage, onReject }: SwipeableCardProps) {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const handleDragStart = (clientX: number) => {
    setIsDragging(true);
    setStartX(clientX);
  };

  const handleDragMove = (clientX: number) => {
    if (!isDragging) return;
    const diff = clientX - startX;
    setDragX(diff);
  };

  const handleDragEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const threshold = 100;
    
    // Swipe right - move to next stage
    if (dragX > threshold && currentStage !== 'Offer' && currentStage !== 'Rejected') {
      onMoveToNextStage(candidate, currentStage);
    }
    // Swipe left - reject (only if past Qualified stage)
    else if (dragX < -threshold && currentStage !== 'Qualified' && currentStage !== 'Rejected') {
      onReject(candidate, currentStage);
    }

    setDragX(0);
  };

  const bgColor = dragX > 100 ? 'bg-green-500/20' : dragX < -100 ? 'bg-red-500/20' : '';
  const showRightIcon = dragX > 50 && currentStage !== 'Offer' && currentStage !== 'Rejected';
  const showLeftIcon = dragX < -50 && currentStage !== 'Qualified' && currentStage !== 'Rejected';

  return (
    <div className="relative overflow-hidden">
      {/* Background Icons */}
      {showRightIcon && (
        <div className="absolute inset-y-0 right-4 flex items-center z-0">
          <ArrowRight className="w-6 h-6 text-green-400" />
        </div>
      )}
      {showLeftIcon && (
        <div className="absolute inset-y-0 left-4 flex items-center z-0">
          <X className="w-6 h-6 text-red-400" />
        </div>
      )}

      {/* Swipeable Card */}
      <div
        className={`relative z-10 flex items-center gap-3 px-4 py-3 border-t border-gray-800/30 cursor-pointer transition-all group ${bgColor}`}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease-out, background-color 0.3s',
        }}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
        onClick={(e) => {
          if (Math.abs(dragX) < 5) {
            onSelectCandidate(candidate.id);
          }
        }}
      >
        <img
          src={candidate.avatar}
          alt={candidate.name}
          className="w-12 h-12 rounded-full ring-2 ring-gray-800/50 group-hover:ring-blue-500/30 transition-all flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold truncate">{candidate.name}</span>
            <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 rounded-full border border-blue-500/30">
              {candidate.match}%
            </span>
          </div>
          <p className="text-xs text-gray-500 truncate">{candidate.handle} • {candidate.role}</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
      </div>
    </div>
  );
}

export function Pipeline({ onSelectCandidate }: PipelineProps) {
  const [expandedStage, setExpandedStage] = useState<string | null>('Qualified');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showOverview, setShowOverview] = useState(true);
  const [pipelineData, setPipelineData] = useState<PipelineData>({
    all: {
      Qualified: [],
      Screening: [],
      'Round 1': [],
      'Round 2': [],
      Final: [],
      Offer: [],
      Rejected: [],
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [jobRoles, setJobRoles] = useState([
    { id: 'all', name: 'All Matches', count: 0 },
  ]);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    show: boolean;
    type: 'advance' | 'reject';
    candidate: Candidate | null;
    currentStage: string;
    nextStage: string;
  }>({
    show: false,
    type: 'advance',
    candidate: null,
    currentStage: '',
    nextStage: '',
  });
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationCandidate, setNotificationCandidate] = useState<Candidate | null>(null);
  const [notificationStage, setNotificationStage] = useState({ from: '', to: '' });
  const [notificationMessage, setNotificationMessage] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Load candidates and distribute them in pipeline
  useEffect(() => {
    const loadCandidates = async () => {
      try {
        const response = await axios.get(`${API_BASE}/candidates`);
        const candidates = response.data;

        // Distribute candidates across pipeline stages
        const distributedData = distributeCandidates(candidates);
        setPipelineData(distributedData);

        // Create job roles menu
        const roles = [
          { id: 'all', name: 'All Matches', count: Object.values(distributedData.all).flat().length },
        ];

        Object.keys(distributedData).forEach(role => {
          if (role !== 'all') {
            const roleCount = Object.values(distributedData[role]).flat().length;
            if (roleCount > 0) {
              roles.push({ id: role, name: role, count: roleCount });
            }
          }
        });

        setJobRoles(roles);
      } catch (error) {
        console.error('Failed to load candidates:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCandidates();
  }, []);

  const currentPipeline = pipelineData[selectedRole as keyof typeof pipelineData] || pipelineData.all;
  const totalCandidates = Object.values(currentPipeline).flat().length;
  const selectedRoleData = jobRoles.find((r) => r.id === selectedRole);

  // Prepare chart data
  const chartData = Object.entries(currentPipeline).map(([stage, candidates]) => ({
    stage: stage === 'Round 1' ? 'R1' : stage === 'Round 2' ? 'R2' : stage.charAt(0),
    fullStage: stage,
    count: candidates.length,
  }));

  const handleMoveToNextStage = (candidate: Candidate, currentStage: string) => {
    const currentIndex = stageOrder.indexOf(currentStage);
    const nextStage = stageOrder[currentIndex + 1];
    
    setConfirmationDialog({
      show: true,
      type: 'advance',
      candidate,
      currentStage,
      nextStage,
    });
  };

  const handleReject = (candidate: Candidate, currentStage: string) => {
    setConfirmationDialog({
      show: true,
      type: 'reject',
      candidate,
      currentStage,
      nextStage: 'Rejected',
    });
  };

  const confirmAction = () => {
    // Show notification modal after confirming advance
    if (confirmationDialog.type === 'advance' && confirmationDialog.candidate) {
      setNotificationCandidate(confirmationDialog.candidate);
      setNotificationStage({
        from: confirmationDialog.currentStage,
        to: confirmationDialog.nextStage
      });
      setShowNotificationModal(true);
      setConfirmationDialog({ show: false, type: 'advance', candidate: null, currentStage: '', nextStage: '' });
    } else {
      // For reject, just update without notification
      console.log(`Rejecting ${confirmationDialog.candidate?.name}`);
      setConfirmationDialog({ show: false, type: 'advance', candidate: null, currentStage: '', nextStage: '' });
    }
  };

  const cancelAction = () => {
    setConfirmationDialog({ show: false, type: 'advance', candidate: null, currentStage: '', nextStage: '' });
  };

  const handleGenerateAIMessage = async () => {
    setIsGeneratingAI(true);

    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const messages = {
      Screening: `Hi ${notificationCandidate?.name}! Great news - we'd like to move forward with your application. Your background really stood out to us.\n\nWe'd love to schedule a brief screening call to learn more about your experience and discuss the role. Are you available for a 30-minute call this week?`,
      'Round 1': `Hi ${notificationCandidate?.name}! Thanks for the great conversation during our screening call. We're excited to move you forward to the next stage.\n\nI'd like to schedule a technical interview with our engineering team. This will be about 60 minutes and will focus on your technical skills and problem-solving approach.`,
      'Round 2': `Hi ${notificationCandidate?.name}! You did excellent in the first round interview. We'd like to invite you to the second round.\n\nThis will be a deeper technical discussion with our senior engineers, focusing on system design and your approach to complex problems.`,
      Final: `Hi ${notificationCandidate?.name}! We're really impressed with your performance so far. We'd like to invite you to a final round interview.\n\nThis will be with our leadership team to discuss culture fit, team dynamics, and answer any questions you have about the role and company.`,
      Offer: `Hi ${notificationCandidate?.name}! Congratulations! We're thrilled to extend you an offer to join our team.\n\nI'll be sending over the formal offer details shortly. Looking forward to hopefully having you on board!`
    };

    const message = messages[notificationStage.to as keyof typeof messages] || `Congratulations! You've been advanced to ${notificationStage.to}.`;
    setNotificationMessage(message);
    setIsGeneratingAI(false);
  };

  const handleSendNotification = async () => {
    if (!notificationCandidate || !notificationMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      await axios.post(`${API_BASE}/notifications`, {
        candidate_id: parseInt(notificationCandidate.id),
        message: notificationMessage,
        event_type: 'stage_advance',
        from_stage: notificationStage.from,
        to_stage: notificationStage.to,
        is_ai_generated: isGeneratingAI
      });

      // Also update the pipeline stage
      await axios.put(`${API_BASE}/candidates/${notificationCandidate.id}/pipeline`, {
        candidate_id: parseInt(notificationCandidate.id),
        pipeline_stage: notificationStage.to
      });

      console.log('Notification sent and pipeline updated!');

      // Close modal and reset
      setShowNotificationModal(false);
      setNotificationMessage('');
      setNotificationCandidate(null);

      // Reload candidates to update pipeline view
      window.location.reload();
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification');
    }
  };

  const handleSkipNotification = async () => {
    if (!notificationCandidate) return;

    try {
      // Just update the pipeline stage without notification
      await axios.put(`${API_BASE}/candidates/${notificationCandidate.id}/pipeline`, {
        candidate_id: parseInt(notificationCandidate.id),
        pipeline_stage: notificationStage.to
      });

      setShowNotificationModal(false);
      setNotificationMessage('');
      setNotificationCandidate(null);

      // Reload candidates
      window.location.reload();
    } catch (error) {
      console.error('Failed to update pipeline:', error);
      alert('Failed to update pipeline');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl border-b border-gray-800/50 z-10 pb-4">
        <div className="p-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <h1 className="text-xl">Recruiting Pipeline</h1>

            {/* Role Filter Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2 px-3 py-2 bg-gray-900/60 hover:bg-gray-800/80 rounded-xl border border-gray-800/50 transition-all text-sm"
              >
                <span>{selectedRoleData?.name || 'All Matches'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>

              {showRoleDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowRoleDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-gray-950 border border-gray-800/50 rounded-xl overflow-hidden z-20 shadow-xl">
                    {jobRoles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => {
                          setSelectedRole(role.id);
                          setShowRoleDropdown(false);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                          selectedRole === role.id
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-gray-300 hover:bg-gray-900/60'
                        }`}
                      >
                        <span>{role.name}</span>
                        <span className="text-xs bg-gray-700/50 px-2 py-0.5 rounded-full">
                          {role.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-400">
            {isLoading ? 'Loading candidates...' : `${totalCandidates} ${totalCandidates === 1 ? 'candidate' : 'candidates'} in progress`}
          </p>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Pipeline Overview */}
        <div className="border-b border-gray-800/50">
          <button
            onClick={() => setShowOverview(!showOverview)}
            className="w-full flex items-center justify-between p-4 hover:bg-gradient-to-r hover:from-gray-900/40 hover:to-transparent transition-all"
          >
            <h2 className="text-lg">Pipeline Overview</h2>
            {showOverview ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>
          
          {showOverview && (
            <div className="px-4 pb-4">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                  <XAxis 
                    dataKey="stage" 
                    stroke="#4B5563" 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="#4B5563" 
                    tick={{ fill: '#6B7280', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    width={25}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#3B82F6" fillOpacity={0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Pipeline Stages */}
        {Object.entries(currentPipeline).map(([stage, candidates]) => (
          <div key={stage} className="border-b border-gray-800/50">
            <button
              onClick={() => setExpandedStage(expandedStage === stage ? null : stage)}
              className="w-full flex items-center gap-3 p-4 hover:bg-gradient-to-r hover:from-gray-900/40 hover:to-transparent transition-all"
            >
              <ChevronRight
                className={`w-5 h-5 text-gray-500 transition-transform ${
                  expandedStage === stage ? 'rotate-90' : ''
                }`}
              />
              <div className="text-left">
                <h3 className="font-semibold">{stage}</h3>
                <p className="text-sm text-gray-500">
                  {candidates.length} {candidates.length === 1 ? 'candidate' : 'candidates'}
                </p>
              </div>
            </button>

            {/* Candidates in Stage */}
            {expandedStage === stage && (
              <div className="bg-gradient-to-b from-gray-900/20 to-transparent">
                {candidates.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-900/50 flex items-center justify-center">
                      <ChevronRight className="w-6 h-6 text-gray-700" />
                    </div>
                    <p className="text-sm text-gray-500">No candidates in this stage</p>
                  </div>
                ) : (
                  candidates.map((candidate) => (
                    <SwipeableCard
                      key={candidate.id}
                      candidate={candidate}
                      currentStage={stage}
                      onSelectCandidate={onSelectCandidate}
                      onMoveToNextStage={handleMoveToNextStage}
                      onReject={handleReject}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Confirmation Dialog */}
      {confirmationDialog.show && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={confirmationDialog.candidate?.avatar}
                alt={confirmationDialog.candidate?.name}
                className="w-12 h-12 rounded-full ring-2 ring-gray-800"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{confirmationDialog.candidate?.name}</h3>
                <p className="text-sm text-gray-400">{confirmationDialog.candidate?.handle}</p>
              </div>
            </div>

            <div className="mb-6">
              {confirmationDialog.type === 'advance' ? (
                <p className="text-gray-300">
                  Move this candidate from <span className="text-blue-400 font-semibold">{confirmationDialog.currentStage}</span> to <span className="text-green-400 font-semibold">{confirmationDialog.nextStage}</span>?
                </p>
              ) : (
                <p className="text-gray-300">
                  Reject this candidate and move them to <span className="text-red-400 font-semibold">Rejected</span>?
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelAction}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 px-4 py-3 rounded-xl transition-colors ${
                  confirmationDialog.type === 'advance'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {confirmationDialog.type === 'advance' ? 'Advance' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      {showNotificationModal && notificationCandidate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-lg w-full">
            <div className="flex items-center gap-3 mb-4">
              <img
                src={notificationCandidate.avatar}
                alt={notificationCandidate.name}
                className="w-12 h-12 rounded-full ring-2 ring-gray-800"
              />
              <div className="flex-1">
                <h3 className="font-semibold">{notificationCandidate.name}</h3>
                <p className="text-sm text-gray-400">
                  Advanced to <span className="text-blue-400">{notificationStage.to}</span>
                </p>
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Notification Message</label>
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Write a message to notify the candidate..."
                rows={6}
                className="w-full px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-sm"
              />
            </div>

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleGenerateAIMessage}
                disabled={isGeneratingAI}
                className="flex-1 px-4 py-2.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 rounded-xl transition-all flex items-center justify-center gap-2 text-blue-400 text-sm disabled:opacity-50"
              >
                {isGeneratingAI ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate with AI
                  </>
                )}
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSkipNotification}
                className="px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors text-sm"
              >
                Skip Notification
              </button>
              <button
                onClick={handleSendNotification}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
              >
                <Send className="w-4 h-4" />
                Send & Advance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}