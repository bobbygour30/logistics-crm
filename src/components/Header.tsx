import { Truck, Plus, Phone } from 'lucide-react';

type HeaderProps = {
  onNewTicket: () => void;
  onNewIVRCall: () => void;
};

export function Header({ onNewTicket, onNewIVRCall }: HeaderProps) {
  return (
    <header className="bg-gradient-to-r from-amber-600 to-orange-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-white p-2 rounded-lg">
              <Truck className="w-8 h-8 text-amber-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Golden Roadways Logistics</h1>
              <p className="text-amber-100 text-sm">Customer Relationship Management System</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onNewIVRCall}
              className="bg-white text-amber-700 px-4 py-2 rounded-lg font-medium hover:bg-amber-50 transition-colors flex items-center space-x-2 shadow"
            >
              <Phone className="w-4 h-4" />
              <span>Log IVR Call</span>
            </button>
            <button
              onClick={onNewTicket}
              className="bg-white text-orange-700 px-4 py-2 rounded-lg font-medium hover:bg-orange-50 transition-colors flex items-center space-x-2 shadow"
            >
              <Plus className="w-4 h-4" />
              <span>New Ticket</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
