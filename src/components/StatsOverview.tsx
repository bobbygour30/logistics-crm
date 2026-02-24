// src/components/StatsOverview.tsx (FINAL - Both Status + Color filters fully working)
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
    { label: 'Yellow', value: colorStats.yellow, color: 'bg-yellow-400', key: 'yellow' as const },
    { label: 'Orange', value: colorStats.orange, color: 'bg-orange-400', key: 'orange' as const },
    { label: 'Red',    value: colorStats.red,    color: 'bg-red-400',    key: 'red' as const },
    { label: 'Green',  value: colorStats.green,  color: 'bg-green-400',  key: 'green' as const },
  ];

  return (
    <div className="p-6 border-b border-gray-100 bg-white">
      

      {/* Color / Priority Cards */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Priority Color</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {colorCards.map((card) => (
            <button
              key={card.key}
              onClick={() => onColorClick(card.key)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md active:scale-[0.985] transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 group flex items-center gap-4"
            >
              <div className={`w-5 h-5 rounded-full ${card.color} flex-shrink-0 ring-1 ring-offset-2 ring-white`} />
              <div>
                <p className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                  {card.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}