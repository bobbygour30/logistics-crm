import { Search, Filter } from 'lucide-react';

type FilterBarProps = {
  statusFilter: 'all' | 'open' | 'working' | 'closed' | 'satisfied';
  searchQuery: string;
  onStatusChange: (status: 'all' | 'open' | 'working' | 'closed' | 'satisfied') => void;
  onSearchChange: (query: string) => void;
};

export function FilterBar({
  statusFilter,
  searchQuery,
  onStatusChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search tickets by number, title, customer, or tracking..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusChange(
                e.target.value as 'all' | 'open' | 'working' | 'closed' | 'satisfied'
              )
            }
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="working">In Progress</option>
            <option value="closed">Closed</option>
            <option value="satisfied">Satisfied</option>
          </select>
        </div>
      </div>
    </div>
  );
}