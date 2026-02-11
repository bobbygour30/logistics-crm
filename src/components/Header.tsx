import { Plus, Phone, LogOut } from "lucide-react";

type HeaderProps = {
  onNewTicket: () => void;
  onNewIVRCall: () => void;
  onLogout: () => void;
};

export function Header({
  onNewTicket,
  onNewIVRCall,
  onLogout,
}: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-blue-900 via-blue-800 to-black shadow-lg sticky top-0 z-50">
      <div className=" px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-4 gap-4">
          
          {/* LEFT: LOGO + TITLE */}
          <div className="flex items-center gap-4">
            <div className="bg-white p-2 rounded-lg shadow flex-shrink-0">
              <img
                src="https://goldenroadwaysandlogistics.com/assets/logo-YpDDdl4s.webp"
                alt="Golden Roadways Logo"
                className="h-10 sm:h-12 w-auto object-contain"
              />
            </div>

            <div className="leading-tight">
              <h1 className="text-lg sm:text-2xl font-bold text-white">
                Golden Roadways Logistics
              </h1>
              <p className="text-xs sm:text-sm text-yellow-300">
                Customer Relationship Management System
              </p>
            </div>
          </div>

          {/* RIGHT: ACTIONS */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 justify-start sm:justify-end">
            <button
              onClick={onNewIVRCall}
              className="bg-yellow-400 text-black px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-yellow-500 transition flex items-center gap-2 shadow text-sm"
            >
              <Phone className="w-4 h-4" />
              <span className="hidden sm:inline">Log IVR Call</span>
              <span className="sm:hidden">IVR</span>
            </button>

            <button
              onClick={onNewTicket}
              className="bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition flex items-center gap-2 shadow text-sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Ticket</span>
              <span className="sm:hidden">Ticket</span>
            </button>

            <button
              onClick={onLogout}
              className="bg-black text-yellow-400 border border-yellow-400 px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-yellow-400 hover:text-black transition flex items-center gap-2 shadow text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
