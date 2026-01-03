import { TicketCheck, AlertCircle, Clock, CheckCircle } from 'lucide-react';

type StatsProps = {
  stats: {
    total: number;
    open: number;
    working: number;
    closed: number;
    satisfied: number;
  };
};

export function StatsOverview({ stats }: StatsProps) {
  const cards = [
    { label: 'Total Tickets', value: stats.total, icon: TicketCheck, color: 'bg-blue-500' },
    { label: 'Open', value: stats.open, icon: AlertCircle, color: 'bg-red-500' },
    { label: 'In Progress', value: stats.working, icon: Clock, color: 'bg-amber-500' },
    { label: 'Closed', value: stats.closed, icon: CheckCircle, color: 'bg-gray-500' },
    { label: 'Satisfied', value: stats.satisfied, icon: CheckCircle, color: 'bg-green-500' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {cards.map((card) => (
        <div key={card.label} className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{card.label}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{card.value}</p>
            </div>
            <div className={`${card.color} p-3 rounded-lg`}>
              <card.icon className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
