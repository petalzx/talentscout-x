import { useState, useEffect } from 'react';
import { Star, ThumbsUp, ThumbsDown, ArrowRight, X, ChevronRight, Clock, Sparkles, Edit3, CheckCircle, Send, AlertCircle, FileText } from 'lucide-react';
import axios from 'axios';
import { USER_PERSONAS } from '../config/userPersonas';

const API_BASE = 'http://localhost:8000';

type FeedbackTab = 'recent' | 'awaiting';

interface Candidate {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  role: string;
  match: number;
  stage: string;
  feedback_count: number;
  avg_rating: number;
  top_recommendation: string;
}

interface Feedback {
  id: number;
  candidate_id: number;
  interviewer_id: string;
  interviewer_name: string;
  interviewer_role: string;
  interviewer_avatar: string;
  stage: string;
  rating: number;
  recommendation: string;
  technical_skills: number;
  communication: number;
  culture_fit: number;
  comments: string;
  strengths: string[];
  concerns: string[];
  created_at: string;
}

interface Assessment {
  id: number;
  candidate_id: number;
  candidate_name: string;
  candidate_avatar: string;
  candidate_handle: string;
  candidate_role: string;
  title: string;
  description?: string;
  assessment_type: string;
  time_limit: number;
  status: string;
  assigned_engineer_id?: string;
  assigned_engineer_name?: string;
  assigned_engineer_role?: string;
  assigned_engineer_avatar?: string;
  completed_at: string;
  created_at: string;
}

interface FeedbackProps {
  onSelectCandidate: (id: string) => void;
}

export function Feedback({ onSelectCandidate }: FeedbackProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candidateFeedback, setCandidateFeedback] = useState<Feedback[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FeedbackTab>('recent');
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [selectedEngineer, setSelectedEngineer] = useState('');

  const [confirmationDialog, setConfirmationDialog] = useState<{
    show: boolean;
    type: 'advance' | 'reject' | 'waitlist';
    candidate: Candidate | null;
  }>({
    show: false,
    type: 'advance',
    candidate: null,
  });
  const [showMessageOptions, setShowMessageOptions] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [aiGeneratedMessage, setAiGeneratedMessage] = useState('');
  const [manualMessage, setManualMessage] = useState('');

  // Available engineers for forwarding assessments (from userPersonas)
  const availableEngineers = USER_PERSONAS.slice(1); // Exclude main recruiter

  useEffect(() => {
    loadCandidatesWithFeedback();
    loadAssessmentsAwaitingFeedback();
  }, []);

  useEffect(() => {
    if (selectedCandidate) {
      loadCandidateFeedback(parseInt(selectedCandidate.id));
    }
  }, [selectedCandidate]);

  const loadCandidatesWithFeedback = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE}/feedback/candidates-with-feedback`);
      setCandidates(response.data);
    } catch (error) {
      console.error('Failed to load candidates with feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCandidateFeedback = async (candidateId: number) => {
    try {
      const response = await axios.get(`${API_BASE}/candidates/${candidateId}/feedback`);
      setCandidateFeedback(response.data);
    } catch (error) {
      console.error('Failed to load candidate feedback:', error);
    }
  };

  const loadAssessmentsAwaitingFeedback = async () => {
    try {
      const response = await axios.get(`${API_BASE}/assessments/awaiting-feedback`);
      setAssessments(response.data);
    } catch (error) {
      console.error('Failed to load assessments:', error);
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

  const getRecommendationColor = (rec: string) => {
    if (rec === 'strong-yes') return 'from-green-500/20 to-emerald-500/20 border-green-500/30 text-green-400';
    if (rec === 'yes') return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400';
    if (rec === 'maybe') return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400';
    if (rec === 'no') return 'from-orange-500/20 to-red-500/20 border-orange-500/30 text-orange-400';
    return 'from-red-500/20 to-pink-500/20 border-red-500/30 text-red-400';
  };

  const getRecommendationBadgeColor = (rec: string) => {
    if (rec === 'strong-yes') return 'bg-green-500/20 border-green-500/30 text-green-400';
    if (rec === 'yes') return 'bg-blue-500/20 border-blue-500/30 text-blue-400';
    if (rec === 'maybe') return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400';
    if (rec === 'no') return 'bg-orange-500/20 border-orange-500/30 text-orange-400';
    return 'bg-red-500/20 border-red-500/30 text-red-400';
  };

  const handleAdvance = (candidate: Candidate) => {
    setConfirmationDialog({ show: true, type: 'advance', candidate });
  };

  const handleReject = (candidate: Candidate) => {
    setConfirmationDialog({ show: true, type: 'reject', candidate });
  };

  const handleWaitlist = (candidate: Candidate) => {
    setConfirmationDialog({ show: true, type: 'waitlist', candidate });
  };

  const handleForwardAssessment = (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowForwardModal(true);
  };

  const confirmForward = async () => {
    if (!selectedEngineer || !selectedAssessment) {
      alert('Please select an engineer');
      return;
    }

    const engineer = availableEngineers.find(e => e.id === selectedEngineer);
    if (!engineer) return;

    try {
      await axios.post(`${API_BASE}/assessments/forward`, {
        assessment_id: selectedAssessment.id,
        engineer_id: engineer.id,
        engineer_name: engineer.name.replace('You (', '').replace(')', ''),
        engineer_role: engineer.role,
        engineer_avatar: engineer.avatar
      });

      setShowForwardModal(false);
      setSelectedAssessment(null);
      setSelectedEngineer('');
      loadAssessmentsAwaitingFeedback();
    } catch (error) {
      console.error('Failed to forward assessment:', error);
      alert('Failed to forward assessment');
    }
  };

  const confirmAction = async () => {
    const action = confirmationDialog.type === 'advance' ? 'Advancing' : confirmationDialog.type === 'reject' ? 'Rejecting' : 'Waitlisting';
    console.log(`${action} ${confirmationDialog.candidate?.name}`);

    // Update pipeline stage in backend
    try {
      let newStage = null;
      if (confirmationDialog.type === 'advance') {
        // Advance to next stage
        const currentStage = confirmationDialog.candidate?.stage;
        const stages = ['Qualified', 'Screening', 'Round 1', 'Round 2', 'Final', 'Offer'];
        const currentIndex = stages.indexOf(currentStage || 'Qualified');
        newStage = currentIndex < stages.length - 1 ? stages[currentIndex + 1] : 'Offer';
      } else if (confirmationDialog.type === 'reject') {
        newStage = 'Rejected';
      }

      await axios.post(`${API_BASE}/candidates/update-pipeline`, {
        candidate_id: parseInt(confirmationDialog.candidate?.id || '0'),
        pipeline_stage: newStage
      });

      // Send notification if there's a message
      if (aiGeneratedMessage || manualMessage) {
        await axios.post(`${API_BASE}/notifications`, {
          candidate_id: parseInt(confirmationDialog.candidate?.id || '0'),
          message: aiGeneratedMessage || manualMessage,
          event_type: confirmationDialog.type === 'advance' ? 'stage_advance' : confirmationDialog.type === 'reject' ? 'stage_reject' : 'waitlist',
          from_stage: confirmationDialog.candidate?.stage,
          to_stage: newStage,
          is_ai_generated: !!aiGeneratedMessage
        });
      }

      setConfirmationDialog({ show: false, type: 'advance', candidate: null });
      setSelectedCandidate(null);
      setShowMessageOptions(false);
      setAiGeneratedMessage('');
      setManualMessage('');
      loadCandidatesWithFeedback();
    } catch (error) {
      console.error('Failed to update candidate:', error);
      alert('Failed to update candidate');
    }
  };

  const generateAIMessage = () => {
    setGeneratingAI(true);

    setTimeout(() => {
      const candidate = confirmationDialog.candidate;
      const feedback = candidateFeedback[0];

      let message = '';

      if (confirmationDialog.type === 'advance') {
        message = `Hi ${candidate?.name},\n\nThank you for taking the time to interview with us. We were impressed with your ${feedback?.strengths[0]?.toLowerCase() || 'skills and experience'}.\n\nWe're excited to move you forward to the next stage of our hiring process. You'll hear from us within the next few days with details about scheduling.\n\nLooking forward to continuing our conversation!\n\nBest regards,\nThe Recruiting Team`;
      } else if (confirmationDialog.type === 'waitlist') {
        message = `Hi ${candidate?.name},\n\nThank you for your interest in joining our team and for the time you spent interviewing with us.\n\nWhile we were impressed by your ${feedback?.strengths[0]?.toLowerCase() || 'background'}, we've decided to move forward with other candidates for this specific role at this time.\n\nHowever, we'd like to keep you in mind for future opportunities that may be a better fit. We'll reach out if a relevant position opens up.\n\nThank you again for your time and interest!\n\nBest regards,\nThe Recruiting Team`;
      } else {
        message = `Hi ${candidate?.name},\n\nThank you for taking the time to interview with us for the ${candidate?.role} position.\n\nAfter careful consideration, we've decided to move forward with other candidates whose experience more closely aligns with our current needs.\n\nWe appreciate your interest in our company and wish you the best in your job search.\n\nBest regards,\nThe Recruiting Team`;
      }

      setAiGeneratedMessage(message);
      setGeneratingAI(false);
    }, 1500);
  };

  if (selectedCandidate) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl border-b border-gray-800/50 z-10">
          <div className="p-6">
            <button
              onClick={() => setSelectedCandidate(null)}
              className="flex items-center gap-2 text-gray-400 hover:text-gray-300 mb-4 transition-colors"
            >
              <ChevronRight className="w-5 h-5 rotate-180" />
              Back to Feedback
            </button>
            <div className="flex items-center gap-4">
              <img
                src={selectedCandidate.avatar}
                alt={selectedCandidate.name}
                className="w-16 h-16 rounded-full ring-2 ring-gray-800"
              />
              <div className="flex-1">
                <h1 className="text-2xl mb-1">{selectedCandidate.name}</h1>
                <p className="text-sm text-gray-400">{selectedCandidate.role} • {selectedCandidate.stage}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Feedback Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {candidateFeedback.map((feedback) => (
            <div key={feedback.id} className="bg-gray-900/50 border border-gray-800 rounded-xl p-5">
              {/* Interviewer Info */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={feedback.interviewer_avatar}
                    alt={feedback.interviewer_name}
                    className="w-10 h-10 rounded-full ring-2 ring-gray-800"
                  />
                  <div>
                    <h4>{feedback.interviewer_name}</h4>
                    <p className="text-xs text-gray-400">{feedback.interviewer_role} • {feedback.stage}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatTimestamp(feedback.created_at)}</span>
              </div>

              {/* Overall Rating & Recommendation */}
              <div className="flex gap-3 mb-4">
                <div className="flex-1 bg-gray-900/80 border border-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Overall Rating</p>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className={`flex-1 bg-gradient-to-r ${getRecommendationColor(feedback.recommendation)} border rounded-lg p-3`}>
                  <p className="text-xs opacity-70 mb-1">Recommendation</p>
                  <p className="capitalize">{feedback.recommendation.replace('-', ' ')}</p>
                </div>
              </div>

              {/* Skills Breakdown */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Technical</p>
                  <p className="text-blue-400">{feedback.technical_skills}/5</p>
                </div>
                <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Communication</p>
                  <p className="text-purple-400">{feedback.communication}/5</p>
                </div>
                <div className="bg-gray-900/80 border border-gray-800 rounded-lg p-3">
                  <p className="text-xs text-gray-400 mb-1">Culture Fit</p>
                  <p className="text-pink-400">{feedback.culture_fit}/5</p>
                </div>
              </div>

              {/* Comments */}
              <div className="mb-4">
                <p className="text-xs text-gray-400 mb-2">Interview Notes</p>
                <p className="text-sm text-gray-300 leading-relaxed">{feedback.comments}</p>
              </div>

              {/* Strengths */}
              {feedback.strengths.length > 0 && (
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-4 h-4 text-green-400" />
                    <p className="text-xs text-gray-400">Strengths</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {feedback.strengths.map((strength, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-xs"
                      >
                        {strength}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Concerns */}
              {feedback.concerns.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsDown className="w-4 h-4 text-orange-400" />
                    <p className="text-xs text-gray-400">Concerns</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {feedback.concerns.map((concern, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg text-xs"
                      >
                        {concern}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {candidateFeedback.length === 0 && (
            <div className="flex flex-col items-center justify-center h-64 text-center px-6">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-900/50 flex items-center justify-center">
                <ThumbsUp className="w-8 h-8 text-gray-700" />
              </div>
              <h3 className="text-lg mb-2">No Feedback Yet</h3>
              <p className="text-sm text-gray-500 max-w-sm">
                Interview feedback for this candidate will appear here.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 border-t border-gray-800/50 p-6 bg-gradient-to-t from-black via-black to-black/95 backdrop-blur-xl">
          <p className="text-sm text-gray-400 mb-4">Based on this feedback, what would you like to do?</p>
          <div className="flex gap-3">
            <button
              onClick={() => handleReject(selectedCandidate)}
              className="flex-1 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <X className="w-4 h-4" />
              Reject
            </button>
            <button
              onClick={() => handleWaitlist(selectedCandidate)}
              className="flex-1 px-4 py-3 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 border border-yellow-500/30 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Waitlist
            </button>
            <button
              onClick={() => handleAdvance(selectedCandidate)}
              className="flex-1 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-xl transition-all flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Advance
            </button>
          </div>
        </div>

        {/* Message Options Dialog */}
        {confirmationDialog.show && !showMessageOptions && !aiGeneratedMessage && !manualMessage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={confirmationDialog.candidate?.avatar}
                  alt={confirmationDialog.candidate?.name}
                  className="w-12 h-12 rounded-full ring-2 ring-gray-800"
                />
                <div className="flex-1">
                  <h3>{confirmationDialog.candidate?.name}</h3>
                  <p className="text-sm text-gray-400">{confirmationDialog.candidate?.handle}</p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="mb-2">How would you like to notify this candidate?</h4>
                <p className="text-sm text-gray-400">
                  {confirmationDialog.type === 'advance' && 'Moving to next stage'}
                  {confirmationDialog.type === 'reject' && 'Rejecting candidacy'}
                  {confirmationDialog.type === 'waitlist' && 'Adding to waitlist'}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowMessageOptions(true);
                    generateAIMessage();
                  }}
                  className="w-full px-4 py-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 rounded-xl transition-all flex items-center gap-3 group"
                >
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Sparkles className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-blue-400">Generate AI Message</p>
                    <p className="text-xs text-gray-400">Let AI create a personalized update</p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setShowMessageOptions(true);
                    setManualMessage('');
                  }}
                  className="w-full px-4 py-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all flex items-center gap-3"
                >
                  <div className="p-2 bg-gray-700/50 rounded-lg">
                    <Edit3 className="w-5 h-5 text-gray-400" />
                  </div>
                  <div className="flex-1 text-left">
                    <p>Write Manual Message</p>
                    <p className="text-xs text-gray-400">Compose your own update message</p>
                  </div>
                </button>

                <button
                  onClick={confirmAction}
                  className="w-full px-4 py-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-xl transition-all flex items-center gap-3"
                >
                  <div className="flex-1 text-left">
                    <p>Update Status Only</p>
                    <p className="text-xs text-gray-400">No message will be sent</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setConfirmationDialog({ show: false, type: 'advance', candidate: null })}
                className="w-full mt-4 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* AI Message Dialog */}
        {confirmationDialog.show && showMessageOptions && aiGeneratedMessage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={confirmationDialog.candidate?.avatar}
                  alt={confirmationDialog.candidate?.name}
                  className="w-12 h-12 rounded-full ring-2 ring-gray-800"
                />
                <div className="flex-1">
                  <h3>{confirmationDialog.candidate?.name}</h3>
                  <p className="text-sm text-gray-400">AI-Generated Message</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Message Preview (Editable)</label>
                <textarea
                  value={aiGeneratedMessage}
                  onChange={(e) => setAiGeneratedMessage(e.target.value)}
                  className="w-full h-64 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="AI-generated message will appear here..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMessageOptions(false);
                    setAiGeneratedMessage('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={confirmAction}
                  className={`flex-1 px-4 py-3 rounded-xl transition-colors ${
                    confirmationDialog.type === 'advance'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : confirmationDialog.type === 'reject'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  Send & {confirmationDialog.type === 'advance' ? 'Advance' : confirmationDialog.type === 'reject' ? 'Reject' : 'Waitlist'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Manual Message Dialog */}
        {confirmationDialog.show && showMessageOptions && !aiGeneratedMessage && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={confirmationDialog.candidate?.avatar}
                  alt={confirmationDialog.candidate?.name}
                  className="w-12 h-12 rounded-full ring-2 ring-gray-800"
                />
                <div className="flex-1">
                  <h3>{confirmationDialog.candidate?.name}</h3>
                  <p className="text-sm text-gray-400">Write Manual Message</p>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm text-gray-400 mb-2">Your Message</label>
                <textarea
                  value={manualMessage}
                  onChange={(e) => setManualMessage(e.target.value)}
                  className="w-full h-64 px-4 py-3 bg-gray-900/50 border border-gray-800 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder={`Write your message to ${confirmationDialog.candidate?.name}...`}
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowMessageOptions(false);
                    setManualMessage('');
                  }}
                  className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={confirmAction}
                  disabled={!manualMessage.trim()}
                  className={`flex-1 px-4 py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    confirmationDialog.type === 'advance'
                      ? 'bg-blue-500 hover:bg-blue-600'
                      : confirmationDialog.type === 'reject'
                      ? 'bg-red-500 hover:bg-red-600'
                      : 'bg-yellow-500 hover:bg-yellow-600'
                  }`}
                >
                  Send & {confirmationDialog.type === 'advance' ? 'Advance' : confirmationDialog.type === 'reject' ? 'Reject' : 'Waitlist'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Loading State */}
        {confirmationDialog.show && showMessageOptions && generatingAI && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 max-w-sm w-full text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
              <h3 className="mb-2">Generating AI Message...</h3>
              <p className="text-sm text-gray-400">Creating a personalized message based on interview feedback</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="sticky top-0 bg-gradient-to-b from-black via-black to-black/95 backdrop-blur-xl border-b border-gray-800/50 z-10">
        <div className="p-6 pb-0">
          <h1 className="text-2xl mb-1">Interview Feedback</h1>
          <p className="text-sm text-gray-400 mb-4">Review feedback from interviewers and make decisions</p>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('recent')}
              className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'recent'
                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              <span>Recent Feedback</span>
              <span className="ml-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs">
                {candidates.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('awaiting')}
              className={`flex-1 px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 ${
                activeTab === 'awaiting'
                  ? 'bg-gradient-to-r from-blue-500/20 to-blue-500/10 text-blue-400 border border-blue-500/30'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-900/60'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span>Awaiting Feedback</span>
              <span className="ml-1 px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                {assessments.length}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'recent' && (
          <>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : candidates.length > 0 ? (
              candidates.map((candidate) => (
                <div
                  key={candidate.id}
                  onClick={() => setSelectedCandidate(candidate)}
                  className="p-5 border-b border-gray-800/50 hover:bg-gradient-to-r hover:from-gray-900/40 hover:to-transparent cursor-pointer transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={candidate.avatar}
                      alt={candidate.name}
                      className="w-16 h-16 rounded-full ring-2 ring-gray-800/50 group-hover:ring-blue-500/30 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{candidate.name}</h3>
                        <span className="text-xs px-2 py-0.5 bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 rounded-full border border-blue-500/30">
                          {candidate.match}%
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{candidate.handle} • {candidate.role}</p>
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-3.5 h-3.5 ${
                                star <= Math.round(candidate.avg_rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-600'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-gray-500 ml-1">{candidate.avg_rating}/5</span>
                        </div>
                        <span className="text-gray-700">•</span>
                        <span className={`text-xs px-2 py-0.5 border rounded-lg ${getRecommendationBadgeColor(candidate.top_recommendation)}`}>
                          {candidate.top_recommendation.replace('-', ' ')}
                        </span>
                        <span className="text-gray-700">•</span>
                        <span className="text-xs text-gray-500">{candidate.feedback_count} review{candidate.feedback_count > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="px-2 py-1 bg-gray-900/60 border border-gray-800 rounded-lg">
                          Current: {candidate.stage}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-blue-500 transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-900/50 flex items-center justify-center">
                  <ThumbsUp className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-lg mb-2">No Feedback Yet</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Interview feedback will appear here once interviewers submit their evaluations.
                </p>
              </div>
            )}
          </>
        )}

        {activeTab === 'awaiting' && (
          <>
            {assessments.length > 0 ? (
              assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="p-5 border-b border-gray-800/50 hover:bg-gradient-to-r hover:from-gray-900/40 hover:to-transparent transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={assessment.candidate_avatar}
                      alt={assessment.candidate_name}
                      className="w-16 h-16 rounded-full ring-2 ring-gray-800/50 group-hover:ring-blue-500/30 transition-all"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{assessment.candidate_name}</h3>
                        {assessment.status === 'pending' && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 rounded-full border border-yellow-500/30 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                        {assessment.status === 'forwarded' && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/30 flex items-center gap-1">
                            <Send className="w-3 h-3" />
                            Forwarded
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400 mb-3">{assessment.candidate_handle} • {assessment.candidate_role}</p>

                      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <FileText className="w-4 h-4 text-purple-400" />
                          <p className="text-sm font-semibold">{assessment.title}</p>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>Completed {formatTimestamp(assessment.completed_at)}</span>
                          <span className="text-gray-700">•</span>
                          <span>Time limit: {assessment.time_limit} min</span>
                        </div>
                      </div>

                      {assessment.status === 'forwarded' && assessment.assigned_engineer_name && (
                        <div className="flex items-center gap-2 text-xs text-gray-400 bg-blue-500/10 border border-blue-500/20 rounded-lg p-2">
                          <img
                            src={assessment.assigned_engineer_avatar}
                            alt={assessment.assigned_engineer_name}
                            className="w-6 h-6 rounded-full ring-1 ring-gray-800"
                          />
                          <span>Assigned to {assessment.assigned_engineer_name} ({assessment.assigned_engineer_role})</span>
                        </div>
                      )}
                    </div>

                    {assessment.status === 'pending' && (
                      <button
                        onClick={() => handleForwardAssessment(assessment)}
                        className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg transition-all text-sm flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Forward
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-900/50 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-700" />
                </div>
                <h3 className="text-lg mb-2">No Assessments Pending</h3>
                <p className="text-sm text-gray-500 max-w-sm">
                  Completed assessments awaiting engineer feedback will appear here.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Forward Assessment Modal */}
      {showForwardModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl">Forward Assessment</h3>
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setSelectedAssessment(null);
                  setSelectedEngineer('');
                }}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4 p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
                <img
                  src={selectedAssessment.candidate_avatar}
                  alt={selectedAssessment.candidate_name}
                  className="w-12 h-12 rounded-full ring-2 ring-gray-800"
                />
                <div>
                  <p className="font-semibold">{selectedAssessment.candidate_name}</p>
                  <p className="text-sm text-gray-400">{selectedAssessment.title}</p>
                </div>
              </div>

              <label className="block text-sm text-gray-400 mb-2">Select Engineer to Review</label>
              <div className="space-y-2">
                {availableEngineers.map((engineer) => (
                  <button
                    key={engineer.id}
                    onClick={() => setSelectedEngineer(engineer.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      selectedEngineer === engineer.id
                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-400'
                        : 'bg-gray-900/50 border-gray-800 hover:bg-gray-800'
                    }`}
                  >
                    <img
                      src={engineer.avatar}
                      alt={engineer.name}
                      className="w-10 h-10 rounded-full ring-2 ring-gray-800"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-semibold">{engineer.name.replace('You (', '').replace(')', '')}</p>
                      <p className="text-xs text-gray-400">{engineer.role}</p>
                    </div>
                    {selectedEngineer === engineer.id && (
                      <CheckCircle className="w-5 h-5" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowForwardModal(false);
                  setSelectedAssessment(null);
                  setSelectedEngineer('');
                }}
                className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmForward}
                disabled={!selectedEngineer}
                className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forward Assessment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
