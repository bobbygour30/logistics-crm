// src/components/StatsOverview.tsx - Only Color Filters
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
  onColorClick: (color: 'all' | 'yellow' | 'orange' | 'red' | 'green') => void;
};

export function StatsOverview({ 
  statusStats, 
  colorStats, 
  onColorClick 
}: StatsProps) {
  // Status stats are still passed in but not displayed
  // You can use them elsewhere if needed

  const colorCards = [
    { label: 'Yellow', value: colorStats.yellow, color: 'bg-yellow-400', key: 'yellow' as const },
    { label: 'Orange', value: colorStats.orange, color: 'bg-orange-400', key: 'orange' as const },
    { label: 'Red',    value: colorStats.red,    color: 'bg-red-400',    key: 'red' as const },
    { label: 'Green',  value: colorStats.green,  color: 'bg-green-400',  key: 'green' as const },
  ];

  return (
    <div className="p-6 border-b border-gray-100 bg-white">
      {/* Only Color / Priority Cards */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">Filter by Priority Color</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* "All Colors" option */}
          <button
            onClick={() => onColorClick('all')}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md active:scale-[0.985] transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 group flex items-center gap-4"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 flex-shrink-0 ring-1 ring-offset-2 ring-white" />
            <div>
              <p className="text-sm font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
                All Colors
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{colorStats.yellow + colorStats.orange + colorStats.red + colorStats.green}</p>
            </div>
          </button>

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