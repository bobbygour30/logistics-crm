// src/components/TicketDetailModal.tsx (corrected - handle optional color with fallbacks)
import { useState, useEffect } from 'react';
import { X, Calendar, User, Package, MessageSquare } from 'lucide-react';
import { Ticket, Agent, TicketComment } from '../lib/types';

type TicketDetailModalProps = {
  ticket: Ticket;
  onClose: () => void;
  onUpdate: () => void;
};

const statusColors = {
  open: 'bg-red-100 text-red-800 border border-red-300',
  working: 'bg-amber-100 text-amber-800 border border-amber-300',
  closed: 'bg-gray-200 text-gray-800 border border-gray-300',
  satisfied: 'bg-green-100 text-green-800 border border-green-300 font-semibold',
} as const;

const colorBadges = {
  yellow: 'bg-yellow-200 text-yellow-800',
  orange: 'bg-orange-200 text-orange-800',
  red: 'bg-red-200 text-red-800',
  green: 'bg-green-200 text-green-800',
} as const;

// Helper to safely get color
const getStatusColor = (status: string): string => {
  return statusColors[status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800';
};

const getColorBadge = (color: string | undefined): string => {
  return colorBadges[color as keyof typeof colorBadges] || 'bg-gray-100 text-gray-800';
};

export function TicketDetailModal({ ticket, onClose, onUpdate }: TicketDetailModalProps) {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [newComment, setNewComment] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const API_URL = import.meta.env.VITE_API_URL as string || 'http://localhost:3000';

  const [formData, setFormData] = useState<{
    status: string;
    assigned_to: string;
    priority: string;
    color: string;
  }>({
    status: ticket.status,
    assigned_to: ticket.assigned_to || '',
    priority: ticket.priority,
    color: ticket.color ?? 'yellow',  // Fallback to 'yellow'
  });

  useEffect(() => {
    loadAgentsAndComments();
    const interval = setInterval(loadAgentsAndComments, 30000);
    return () => clearInterval(interval);
  }, [ticket.id]);

  const loadAgentsAndComments = async () => {
    try {
      const [agentsRes, commentsRes] = await Promise.all([
        fetch(`${API_URL}/api/agents`),
        fetch(`${API_URL}/api/tickets/${ticket.id}/comments`),
      ]);

      if (!agentsRes.ok || !commentsRes.ok) {
        throw new Error('Failed to load data');
      }

      const agentsData = await agentsRes.json();
      const commentsData = await commentsRes.json();

      setAgents(agentsData.agents || []);
      setComments(commentsData.comments || []);
    } catch (err: unknown) {
      console.error('Error loading agents/comments:', err);
      alert('Failed to load data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticket.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: formData.status,
          assigned_to: formData.assigned_to || null,
          priority: formData.priority,
          color: formData.color,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Update failed');
      }

      onUpdate();
    } catch (err: unknown) {
      alert('Error updating ticket: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await fetch(`${API_URL}/api/tickets/${ticket.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment: newComment.trim(),
          is_internal: false,
          agent_id: null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to add comment');
      }

      setNewComment('');
      loadAgentsAndComments();
    } catch (err: unknown) {
      alert('Error adding comment: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const displayColor = ticket.color ?? 'yellow';  // Safe fallback for display

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b bg-gray-50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{ticket.ticket_number}</h2>
            <p className="text-gray-600 mt-1">{ticket.title}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="open">Open</option>
                  <option value="working">Working</option>
                  <option value="closed">Closed</option>
                  <option value="satisfied">Satisfied</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                <select
                  value={formData.assigned_to}
                  onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="">Unassigned</option>
                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} ({agent.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                >
                  <option value="yellow">Yellow</option>
                  <option value="orange">Orange</option>
                  <option value="red">Red</option>
                  <option value="green">Green</option>
                </select>
              </div>

              <button
                onClick={handleUpdate}
                disabled={loading}
                className={`w-full px-4 py-2 text-white rounded-lg transition-colors ${
                  loading
                    ? 'bg-amber-400 cursor-wait'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                {loading ? 'Updating...' : 'Update Ticket'}
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Ticket Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <User className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Customer:</span>
                    <span className="ml-2 font-medium">{ticket.customers?.name || 'N/A'}</span>
                  </div>
                  <div className="flex items-center">
                    <Package className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{ticket.type}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                    <span className="text-gray-600">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(ticket.created_at).toLocaleString()}
                    </span>
                  </div>
                  {ticket.tracking_number && (
                    <div className="flex items-center">
                      <Package className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="text-gray-600">Tracking:</span>
                      <span className="ml-2 font-medium">{ticket.tracking_number}</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <span className="text-gray-600">Source:</span>
                    <span className="ml-2 font-medium">{ticket.source}</span>
                  </div>
                  <div className="pt-2 flex gap-2">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getStatusColor(ticket.status)
                      }`}
                    >
                      Status: {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                    </span>
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        getColorBadge(displayColor)
                      }`}
                    >
                      Color: {displayColor.charAt(0).toUpperCase() + displayColor.slice(1)}
                    </span>
                  </div>
                </div>
              </div>

              {ticket.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
                </div>
              )}

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Consignment Context</h3>
                <p><strong>GR Date:</strong> {ticket.gr_date || '—'}</p>
                <p><strong>Origin:</strong> {ticket.origin || '—'}</p>
                <p><strong>Destination:</strong> {ticket.destination || '—'}</p>
                <p><strong>Mode Type:</strong> {ticket.mode_type || '—'}</p>
                <p><strong>Packages:</strong> {ticket.packages || '—'}</p>
                <p><strong>Last Movement:</strong> {ticket.last_movement_date ? new Date(ticket.last_movement_date).toLocaleString() : '—'}</p>
                <p><strong>Location:</strong> {ticket.last_known_location || '—'}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Delay Details</h3>
                <p><strong>Delay Start:</strong> {ticket.delay_start_time ? new Date(ticket.delay_start_time).toLocaleString() : '—'}</p>
                <p><strong>Duration:</strong> {ticket.delay_duration_minutes || '—'} mins</p>
                <p><strong>SLA Breached:</strong> {ticket.sla_breached ? 'Yes' : 'No'}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="w-5 h-5 mr-2 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Comments & Updates</h3>
            </div>

            <div className="mb-4">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment or update..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
              <button
                onClick={handleAddComment}
                className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Add Comment
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {comments.length === 0 ? (
                <p className="text-center text-gray-500 text-sm py-4">No comments yet</p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium text-sm">
                          {comment.agents?.name || 'System'}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{comment.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}