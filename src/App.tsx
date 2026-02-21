// src/App.tsx (fully corrected - simplified dashboard to use self-contained TicketList; removed unused states; modals trigger auto-refresh via TicketList polling)
import { useState } from "react";
import { Ticket } from "./lib/types";
import { Header } from "./components/Header";
import { TicketList } from "./components/TicketList";
import { CreateTicketModal } from "./components/CreateTicketModal";
import { TicketDetailModal } from "./components/TicketDetailModal";
import { IVRCallModal } from "./components/IVRCallModal";
import { ConsignmentTracking } from "./components/ConsignmentTracking";
import { GenerateBooking } from "./components/GenerateBooking";
import { AllGRs } from "./components/AllGRs";
import { Login } from "./components/Login";
import { Truck, FileText, Database } from "lucide-react";

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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showIVRModal, setShowIVRModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [currentView, setCurrentView] = useState<
    "dashboard" | "tracking" | "booking" | "all-grs"
  >("dashboard");

  /* ================= LOGIN GATE ================= */
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onNewTicket={() => setShowCreateModal(true)}
        onNewIVRCall={() => setShowIVRModal(true)}
        onLogout={handleLogout}
      />

      {/* NAV */}
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

      {/* CONTENT */}
      <main className="px-4 sm:px-6 lg:px-8 py-8">
        {currentView === "dashboard" ? (
          <TicketList onTicketClick={setSelectedTicket} />
        ) : currentView === "tracking" ? (
          <ConsignmentTracking />
        ) : currentView === "booking" ? (
          <GenerateBooking />
        ) : currentView === "all-grs" ? (
          <AllGRs />
        ) : null}
      </main>

      {/* MODALS */}
      {showCreateModal && (
        <CreateTicketModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
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
            setSelectedTicket(null);
          }}
        />
      )}
    </div>
  );
}

export default App;