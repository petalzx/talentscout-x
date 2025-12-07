import React from 'react';
import { X, Calendar, Clock, Video, User } from 'lucide-react';
import { useState } from 'react';
import { USER_PERSONAS } from '../config/userPersonas';
import axios from 'axios';

const API_BASE = 'http://localhost:8000';

interface ScheduleModalProps {
  candidateName: string;
  candidateId?: string;
  onClose: () => void;
  onScheduled?: () => void;
}

export function ScheduleModal({ candidateName, candidateId, onClose, onScheduled }: ScheduleModalProps) {
  const [meetingType, setMeetingType] = useState('screening');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('30');
  const [selectedInterviewer, setSelectedInterviewer] = useState('');
  const [videoPlatform, setVideoPlatform] = useState('Google Meet');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSchedule = async () => {
    if (!date || !time || !selectedInterviewer) {
      alert('Please fill in date, time, and select an interviewer');
      return;
    }

    setIsSubmitting(true);

    try {
      // Schedule the meeting with interviewer assignment
      await axios.post(`${API_BASE}/events`, {
        candidate_id: candidateId ? parseInt(candidateId) : 0,
        event_type: 'meeting',
        title: `${meetingType.charAt(0).toUpperCase() + meetingType.slice(1)} Interview`,
        description: notes || `${meetingType} interview with ${candidateName}`,
        scheduled_at: `${date}T${time}:00`,
        duration: parseInt(duration),
        meeting_type: videoPlatform.toLowerCase().includes('meet') || videoPlatform.toLowerCase().includes('zoom') ? 'video' : 'in_person',
        meeting_link: videoPlatform,
        notes: notes,
        assigned_interviewer_id: selectedInterviewer
      });

      // Get interviewer info for notifications
      const interviewer = USER_PERSONAS.find(p => p.id === selectedInterviewer);
      const interviewerName = interviewer?.name.replace('You (', '').replace(')', '') || 'Team Member';
      const meetingDateFormatted = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      // Send notification message to the candidate (in their message thread)
      if (candidateId) {
        await axios.post(`${API_BASE}/messages`, {
          candidate_id: parseInt(candidateId),
          sender_id: 'recruiter-1',
          sender_type: 'recruiter',
          message_type: 'text',
          content: `Your interview with ${interviewerName} has been scheduled for ${meetingDateFormatted} at ${time} (${duration} min). We look forward to speaking with you!`
        });

        // Send internal notification to the interviewer
        await axios.post(`${API_BASE}/messages`, {
          candidate_id: parseInt(candidateId),
          sender_id: 'recruiter-1',
          sender_type: 'internal',
          message_type: 'text',
          content: `@${interviewerName}: You've been assigned to interview ${candidateName} on ${meetingDateFormatted} at ${time} (${duration} min). Please review their profile and prepare feedback after the interview.`,
          is_internal: true
        });
      }

      onScheduled?.();
      onClose();
    } catch (error) {
      console.error('Failed to schedule meeting:', error);
      alert('Failed to schedule meeting. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-end">
      <div className="bg-gradient-to-b from-gray-950 to-black w-full rounded-t-3xl max-h-[90vh] overflow-y-auto border-t border-gray-800/50">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-b from-gray-950 to-gray-950/95 backdrop-blur-xl border-b border-gray-800/50 p-5 flex items-center justify-between">
          <h2 className="text-xl">Schedule Meeting</h2>
          <button
            onClick={onClose}
            className="p-2.5 hover:bg-gray-900/60 rounded-xl transition-all border border-gray-800/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
            <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
              <span className="text-blue-500 text-lg">{candidateName[0]}</span>
            </div>
            <div>
              <p className="font-semibold">Meeting with {candidateName}</p>
              <p className="text-sm text-gray-500">Candidate Interview</p>
            </div>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Meeting Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMeetingType('screening')}
                className={`px-4 py-3 rounded-xl transition-all ${
                  meetingType === 'screening'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-900/60 text-gray-400 hover:bg-gray-800/80 border border-gray-800/50'
                }`}
              >
                Screening Call
              </button>
              <button
                onClick={() => setMeetingType('technical')}
                className={`px-4 py-3 rounded-xl transition-all ${
                  meetingType === 'technical'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-900/60 text-gray-400 hover:bg-gray-800/80 border border-gray-800/50'
                }`}
              >
                Technical Interview
              </button>
              <button
                onClick={() => setMeetingType('behavioral')}
                className={`px-4 py-3 rounded-xl transition-all ${
                  meetingType === 'behavioral'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-900/60 text-gray-400 hover:bg-gray-800/80 border border-gray-800/50'
                }`}
              >
                Behavioral
              </button>
              <button
                onClick={() => setMeetingType('final')}
                className={`px-4 py-3 rounded-xl transition-all ${
                  meetingType === 'final'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'bg-gray-900/60 text-gray-400 hover:bg-gray-800/80 border border-gray-800/50'
                }`}
              >
                Final Round
              </button>
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Calendar className="inline w-4 h-4 mr-1" />
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Clock className="inline w-4 h-4 mr-1" />
              Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>

          {/* Interviewer */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <User className="inline w-4 h-4 mr-1" />
              Assign Interviewer
            </label>
            <select
              value={selectedInterviewer}
              onChange={(e) => setSelectedInterviewer(e.target.value)}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select interviewer...</option>
              {USER_PERSONAS.map((persona) => (
                <option key={persona.id} value={persona.id}>
                  {persona.name.replace('You (', '').replace(')', '')} - {persona.role}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              This interviewer will be assigned to provide feedback after the meeting
            </p>
          </div>

          {/* Video Platform */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Video className="inline w-4 h-4 mr-1" />
              Video Platform
            </label>
            <select
              value={videoPlatform}
              onChange={(e) => setVideoPlatform(e.target.value)}
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Google Meet</option>
              <option>Zoom</option>
              <option>Microsoft Teams</option>
              <option>In-person</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Notes (Optional)</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes or agenda items..."
              className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 bg-gradient-to-t from-gray-950 via-gray-950 to-gray-950/95 backdrop-blur-xl border-t border-gray-800/50 p-4 flex gap-3">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-3.5 border border-gray-700/50 text-white rounded-xl hover:bg-gray-900/60 transition-all bg-gray-900/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSchedule}
            disabled={isSubmitting || !date || !time || !selectedInterviewer}
            className="flex-1 px-4 py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Scheduling...' : 'Schedule Meeting'}
          </button>
        </div>
      </div>
    </div>
  );
}
