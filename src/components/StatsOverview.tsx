import { TicketCheck, AlertCircle, Clock, CheckCircle } from 'lucide-react';

type StatsProps = {
  stats: {
    total: number;
    open: number;
    working: number;
    closed: number;
    satisfied: number;
  };
  onStatusClick: (status: 'all' | 'open' | 'working' | 'closed' | 'satisfied') => void;
};

export function StatsOverview({ stats, onStatusClick }: StatsProps) {
  const cards = [
    {
      label: 'Total Tickets',
      value: stats.total,
      icon: TicketCheck,
      color: 'bg-blue-500',
      status: 'all' as const,
    },
    {
      label: 'Open',
      value: stats.open,
      icon: AlertCircle,
      color: 'bg-red-500',
      status: 'open' as const,
    },
    {
      label: 'In Progress',
      value: stats.working,
      icon: Clock,
      color: 'bg-amber-500',
      status: 'working' as const,
    },
    {
      label: 'Closed',
      value: stats.closed,
      icon: CheckCircle,
      color: 'bg-gray-500',
      status: 'closed' as const,
    },
    {
      label: 'Satisfied',
      value: stats.satisfied,
      icon: CheckCircle,
      color: 'bg-green-500',
      status: 'satisfied' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <button
          key={card.label}
          onClick={() => onStatusClick(card.status)}
          className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow duration-200 text-left focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}