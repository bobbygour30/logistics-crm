import { useState, useEffect } from 'react';
import { X, Phone } from 'lucide-react';
import { Customer, Ticket } from '../lib/types';

type IVRCallModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export function IVRCallModal({ onClose, onSuccess }: IVRCallModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL;

  const [formData, setFormData] = useState({
    customer_id: '',
    ticket_id: '',
    phone_number: '',
    call_duration: 0,
    call_type: 'inquiry' as 'inquiry' | 'complaint' | 'delivery_status' | 'billing' | 'other',
    notes: '',
  });

  useEffect(() => {
    loadCustomersAndTickets();
  }, []);

  const loadCustomersAndTickets = async () => {
    try {
      const [customersRes, ticketsRes] = await Promise.all([
        fetch(`${API_URL}/api/customers`),
        fetch(`${API_URL}/api/open-tickets`),
      ]);

      if (!customersRes.ok || !ticketsRes.ok) {
        throw new Error('Failed to load data');
      }

      const customersData = await customersRes.json();
      const ticketsData = await ticketsRes.json();

      setCustomers(customersData.customers || []);
      setTickets(ticketsData.tickets || []);
    } catch (err: any) {
      console.error('Error loading customers/tickets:', err);
      alert('Failed to load options: ' + err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/ivr-calls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone_number: formData.phone_number.trim(),
          customer_id: formData.customer_id || null,
          ticket_id: formData.ticket_id || null,
          call_duration: Number(formData.call_duration),
          call_type: formData.call_type,
          notes: formData.notes.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.details || error.error || 'Failed to log call');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      alert('Error logging IVR call: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="bg-amber-100 p-2 rounded-lg">
              <Phone className="w-6 h-6 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Log IVR Call</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={formData.phone_number}
              onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="+91-XXXXXXXXXX"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer
              </label>
              <select
                value={formData.customer_id}
                onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">Select customer (optional)</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.phone ? `- ${customer.phone}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Related Ticket
              </label>
              <select
                value={formData.ticket_id}
                onChange={(e) => setFormData({ ...formData, ticket_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">No ticket (optional)</option>
                {tickets.map((ticket) => (
                  <option key={ticket.id} value={ticket.id}>
                    {ticket.ticket_number} - {ticket.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Call Type *
              </label>
              <select
                value={formData.call_type}
                onChange={(e) => setFormData({ ...formData, call_type: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="inquiry">Inquiry</option>
                <option value="complaint">Complaint</option>
                <option value="delivery_status">Delivery Status</option>
                <option value="billing">Billing</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Call Duration (seconds) *
              </label>
              <input
                type="number"
                required
                min="0"
                value={formData.call_duration}
                onChange={(e) =>
                  setFormData({ ...formData, call_duration: parseInt(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Call Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              placeholder="Summary of the IVR call, customer concerns, actions taken..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Logging...' : 'Log Call'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}