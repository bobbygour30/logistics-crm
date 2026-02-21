// src/App.tsx (updated nav section and content switcher)
import { useState, useEffect } from "react";
import { Ticket } from "./lib/types";
import { Header } from "./components/Header";
import { StatsOverview } from "./components/StatsOverview";
import { TicketList } from "./components/TicketList";
import { CreateTicketModal } from "./components/CreateTicketModal";
import { TicketDetailModal } from "./components/TicketDetailModal";
import { IVRCallModal } from "./components/IVRCallModal";
import { ConsignmentTracking } from "./components/ConsignmentTracking";
import { GenerateBooking } from "./components/GenerateBooking";
import { AllGRs } from "./components/AllGRs"; // ← NEW IMPORT
import { Login } from "./components/Login";
import { Truck, FileText, Database } from "lucide-react"; // ← Add Database icon

function App() {
  /* ================= AUTH ================= */
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem("isAuthenticated") === "true";
  });

  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    setIsAuthenticated(false);
  };

  /* ================= STATE ================= */
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "working" | "closed" | "satisfied"
  >("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIVRModal, setShowIVRModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "tracking" | "booking" | "all-grs" // ← ADD NEW VIEW
  >("dashboard");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  /* ================= API ================= */
  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/tickets`);
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status}`);
      }
      const data = await response.json();
      setTickets(data.tickets || []);
    } catch (err: any) {
      console.error("Error loading tickets:", err);
      alert("Failed to load tickets: " + err.message);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  /* ================= EFFECT ================= */
  useEffect(() => {
    if (isAuthenticated) {
      loadTickets();
    }
  }, [isAuthenticated]);

  /* ================= LOGIN GATE ================= */
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  /* ================= LOADING ================= */
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

  const stats = {
    total: tickets.length,
    open: tickets.filter((t) => t.status === "open").length,
    working: tickets.filter((t) => t.status === "working").length,
    closed: tickets.filter((t) => t.status === "closed").length,
    satisfied: tickets.filter((t) => t.status === "satisfied").length,
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onNewTicket={() => setShowCreateModal(true)}
        onNewIVRCall={() => setShowIVRModal(true)}
        onLogout={handleLogout}
      />

      {/* NAV ← UPDATED WITH NEW TAB */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            <button
              onClick={() => setCurrentView("dashboard")}
              className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                currentView === "dashboard"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Dashboard
            </button>

            <button
              onClick={() => setCurrentView("tracking")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                currentView === "tracking"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Consignment Tracking</span>
            </button>

            <button
              onClick={() => setCurrentView("booking")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                currentView === "booking"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Generate Booking</span>
            </button>

            {/* ← NEW TAB */}
            <button
              onClick={() => setCurrentView("all-grs")}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 whitespace-nowrap ${
                currentView === "all-grs"
                  ? "border-amber-600 text-amber-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Database className="w-4 h-4" />
              <span>All GRs</span>
            </button>
          </nav>
        </div>
      </div>

      {/* CONTENT ← UPDATED WITH NEW VIEW */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "dashboard" ? (
          <>
            <StatsOverview stats={stats} onStatusClick={setStatusFilter} />

            <TicketList
              onTicketClick={setSelectedTicket}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </>
        ) : currentView === "tracking" ? (
          <ConsignmentTracking />
        ) : currentView === "booking" ? (
          <GenerateBooking />
        ) : currentView === "all-grs" ? ( // ← NEW CASE
          <AllGRs />
        ) : null}
      </main>

      {/* MODALS ← UNCHANGED */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadTickets();
            setShowCreateModal(false);
          }}
        />
      )}

      {showIVRModal && (
        <IVRCallModal
          onClose={() => setShowIVRModal(false)}
          onSuccess={() => setShowIVRModal(false)}
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