// src/components/StatsOverview.tsx (fully corrected - added color stats support; clickable cards for filtering; fixed TS types; improved layout responsiveness)
import { TicketCheck, AlertCircle, Clock, CheckCircle } from 'lucide-react';

type StatusStats = {
  total: number;
  open: number;
  working: number;
  closed: number;
  satisfied: number;
};

type ColorStats = {
  yellow: number;
  orange: number;
  red: number;
  green: number;
};

type StatsProps = {
  statusStats: StatusStats;
  colorStats: ColorStats;
  onStatusClick: (status: 'all' | 'open' | 'working' | 'closed' | 'satisfied') => void;
  onColorClick: (color: 'all' | 'yellow' | 'orange' | 'red' | 'green') => void;
};

export function StatsOverview({ 
  statusStats, 
  colorStats, 
  onStatusClick, 
  onColorClick 
}: StatsProps) {
  const statusCards = [
    {
      label: 'Total Tickets',
      value: statusStats.total,
      icon: TicketCheck,
      color: 'bg-blue-500',
      status: 'all' as const,
    },
    {
      label: 'Open',
      value: statusStats.open,
      icon: AlertCircle,
      color: 'bg-red-500',
      status: 'open' as const,
    },
    {
      label: 'In Progress',
      value: statusStats.working,
      icon: Clock,
      color: 'bg-amber-500',
      status: 'working' as const,
    },
    {
      label: 'Closed',
      value: statusStats.closed,
      icon: CheckCircle,
      color: 'bg-gray-500',
      status: 'closed' as const,
    },
    {
      label: 'Satisfied',
      value: statusStats.satisfied,
      icon: CheckCircle,
      color: 'bg-green-500',
      status: 'satisfied' as const,
    },
  ];

  const colorCards = [
    {
      label: 'Yellow',
      value: colorStats.yellow,
      color: 'bg-yellow-500',
      status: 'yellow' as const,
    },
    {
      label: 'Orange',
      value: colorStats.orange,
      color: 'bg-orange-500',
      status: 'orange' as const,
    },
    {
      label: 'Red',
      value: colorStats.red,
      color: 'bg-red-500',
      status: 'red' as const,
    },
    {
      label: 'Green',
      value: colorStats.green,
      color: 'bg-green-500',
      status: 'green' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {statusCards.map((card) => (
          <button
            key={card.label}
            onClick={() => onStatusClick(card.status)}
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} p-2 sm:p-3 rounded-lg`}>
                <card.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Color Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {colorCards.map((card) => (
          <button
            key={card.label}
            onClick={() => onColorClick(card.status)}
            className="bg-white rounded-lg shadow p-4 sm:p-6 hover:shadow-lg transition-shadow duration-200 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
              </div>
              <div className={`${card.color} p-3 rounded-lg w-12 h-12 flex items-center justify-center`}>
                <span className="text-white font-bold text-sm">{card.label.charAt(0)}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}