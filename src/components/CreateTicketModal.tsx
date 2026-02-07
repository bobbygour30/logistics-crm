// src/components/CreateTicketModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';

type CreateTicketModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

const API_URL = import.meta.env.VITE_API_URL;
export function CreateTicketModal({ onClose, onSuccess }: CreateTicketModalProps) {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    customer_phone: '',
    customer_company_name: '',
    customer_address: '',
    ticket_title: '',
    ticket_description: '',
    ticket_type: 'inquiry' as 'inquiry' | 'complaint' | 'delivery_issue' | 'billing' | 'other',
    ticket_priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    tracking_number: '',
    source: 'api',
  });

  const handlePrefillFromGR = async () => {
    if (!formData.tracking_number.trim()) return;

    try {
      const res = await fetch(`${API_URL}/api/consignments/${formData.tracking_number}`);
      if (!res.ok) throw new Error('GR not found');
      const cons = await res.json();
      setFormData(prev => ({
        ...prev,
        customer_name: cons.consigneeName || '',
        customer_phone: cons.consigneeMobile || '',
        customer_address: cons.consigneeCity || '',
      }));
    } catch (err: any) {
      alert('Failed to prefill: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_name: formData.customer_name.trim(),
          customer_email: formData.customer_email.trim() || undefined,
          customer_phone: formData.customer_phone.trim() || undefined,
          customer_company_name: formData.customer_company_name.trim() || undefined,
          customer_address: formData.customer_address.trim() || undefined,
          ticket_title: formData.ticket_title.trim(),
          ticket_description: formData.ticket_description.trim() || undefined,
          ticket_type: formData.ticket_type,
          ticket_priority: formData.ticket_priority,
          tracking_number: formData.tracking_number.trim() || undefined,
          source: formData.source,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Ticket created successfully:', result);

      onSuccess(); // Refresh ticket list
      onClose();
    } catch (err: any) {
      console.error(err);
      alert('Error creating ticket: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Create New Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input
                type="text"
                required
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.customer_email}
                onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="john@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={formData.customer_phone}
                onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="+91-9876543210"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                value={formData.customer_company_name}
                onChange={(e) => setFormData({ ...formData, customer_company_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="ABC Logistics"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input
              type="text"
              value={formData.customer_address}
              onChange={(e) => setFormData({ ...formData, customer_address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="123 Main St, City"
            />
          </div>

          {/* Ticket Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              required
              value={formData.ticket_title}
              onChange={(e) => setFormData({ ...formData, ticket_title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="Delivery delayed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.ticket_description}
              onChange={(e) => setFormData({ ...formData, ticket_description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              placeholder="Package not delivered on time..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={formData.ticket_type}
                onChange={(e) => setFormData({ ...formData, ticket_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="inquiry">Inquiry</option>
                <option value="complaint">Complaint</option>
                <option value="delivery_issue">Delivery Issue</option>
                <option value="billing">Billing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.ticket_priority}
                onChange={(e) => setFormData({ ...formData, ticket_priority: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number</label>
              <input
                type="text"
                value={formData.tracking_number}
                onChange={(e) => setFormData({ ...formData, tracking_number: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                placeholder="GRL-TRACK-001"
              />
            </div>
          </div>
          {formData.tracking_number && (
            <button type="button" onClick={handlePrefillFromGR} className="mt-2 px-4 py-1 bg-blue-100 text-blue-700 rounded">
              Prefill from GR
            </button>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}