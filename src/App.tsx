import { useState, useEffect } from 'react';
import { Ticket } from './lib/types'; // Updated path if you renamed supabase.ts → types.ts
import { Header } from './components/Header';
import { StatsOverview } from './components/StatsOverview';
import { FilterBar } from './components/FilterBar';
import { TicketList } from './components/TicketList';
import { CreateTicketModal } from './components/CreateTicketModal';
import { TicketDetailModal } from './components/TicketDetailModal';
import { IVRCallModal } from './components/IVRCallModal';
import { APIIntegrationGuide } from './components/APIIntegrationGuide';
import { Settings } from 'lucide-react';

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIVRModal, setShowIVRModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'api'>('dashboard');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    working: tickets.filter((t) => t.status === 'working').length,
    closed: tickets.filter((t) => t.status === 'closed').length,
    satisfied: tickets.filter((t) => t.status === 'satisfied').length,
  };

  // NEW: Load tickets from your MongoDB backend
  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets`);

      if (!response.ok) {
        throw new Error(`Failed to fetch tickets: ${response.status}`);
      }

      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      console.error('Error loading tickets:', err);
      alert('Failed to load tickets: ' + err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    filterTickets();
  }, [tickets, statusFilter, searchQuery]);

  const filterTickets = () => {
    let filtered = [...tickets];

    if (statusFilter !== 'all') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.ticket_number.toLowerCase().includes(query) ||
          t.title.toLowerCase().includes(query) ||
          t.customers?.name?.toLowerCase().includes(query) ||
          t.customers?.company_name?.toLowerCase().includes(query) ||
          t.tracking_number?.toLowerCase().includes(query)
      );
    }

    setFilteredTickets(filtered);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onNewTicket={() => setShowCreateModal(true)}
        onNewIVRCall={() => setShowIVRModal(true)}
      />

      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentView === 'dashboard'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('api')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors flex items-center space-x-2 ${
                currentView === 'api'
                  ? 'border-amber-600 text-amber-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>API Integration</span>
            </button>
          </nav>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'dashboard' ? (
          <>
            <StatsOverview stats={stats} />

            <FilterBar
              statusFilter={statusFilter}
              searchQuery={searchQuery}
              onStatusChange={setStatusFilter}
              onSearchChange={setSearchQuery}
            />

            <TicketList tickets={filteredTickets} onTicketClick={setSelectedTicket} />
          </>
        ) : (
          <APIIntegrationGuide />
        )}
      </main>

      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadTickets(); // This will now use the new API
            setShowCreateModal(false);
          }}
        />
      )}

      {showIVRModal && (
        <IVRCallModal
          onClose={() => setShowIVRModal(false)}
          onSuccess={() => {
            setShowIVRModal(false);
          }}
        />
      )}

      {selectedTicket && (
        <TicketDetailModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onUpdate={() => {
            loadTickets();
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
}

export default App;