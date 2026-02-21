// src/components/FilterBar.tsx (fully corrected - added all filters with proper TS types; responsive grid; consistent icons)
import { Search, Filter } from 'lucide-react';

type FilterBarProps = {
  statusFilter: 'all' | 'open' | 'working' | 'closed' | 'satisfied';
  colorFilter: 'all' | 'yellow' | 'orange' | 'red' | 'green';
  originQuery: string;
  destinationQuery: string;
  delayFilter: 'all' | '<24h' | '24-72h' | '>72h';
  searchQuery: string;
  onStatusChange: (status: 'all' | 'open' | 'working' | 'closed' | 'satisfied') => void;
  onColorChange: (color: 'all' | 'yellow' | 'orange' | 'red' | 'green') => void;
  onOriginChange: (origin: string) => void;
  onDestinationChange: (destination: string) => void;
  onDelayChange: (delay: 'all' | '<24h' | '24-72h' | '>72h') => void;
  onSearchChange: (query: string) => void;
};

export function FilterBar({
  statusFilter,
  colorFilter,
  originQuery,
  destinationQuery,
  delayFilter,
  searchQuery,
  onStatusChange,
  onColorChange,
  onOriginChange,
  onDestinationChange,
  onDelayChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {/* Search Input */}
        <div className="md:col-span-2">
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

        {/* Origin Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Origin..."
            value={originQuery}
            onChange={(e) => onOriginChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          />
        </div>

        {/* Destination Filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Destination..."
            value={destinationQuery}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            value={statusFilter}
            onChange={(e) =>
              onStatusChange(
                e.target.value as 'all' | 'open' | 'working' | 'closed' | 'satisfied'
              )
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="working">In Progress</option>
            <option value="closed">Closed</option>
            <option value="satisfied">Satisfied</option>
          </select>
        </div>

        {/* Color Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            value={colorFilter}
            onChange={(e) =>
              onColorChange(
                e.target.value as 'all' | 'yellow' | 'orange' | 'red' | 'green'
              )
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          >
            <option value="all">All Colors</option>
            <option value="yellow">Yellow</option>
            <option value="orange">Orange</option>
            <option value="red">Red</option>
            <option value="green">Green</option>
          </select>
        </div>

        {/* Delay Filter */}
        <div className="flex items-center space-x-2">
          <Filter className="text-gray-400 w-5 h-5" />
          <select
            value={delayFilter}
            onChange={(e) =>
              onDelayChange(
                e.target.value as 'all' | '<24h' | '24-72h' | '>72h'
              )
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
          >
            <option value="all">All Delays</option>
            <option value="<24h">&lt; 24h</option>
            <option value="24-72h">24-72h</option>
            <option value=">72h">&gt; 72h</option>
          </select>
        </div>
      </div>
    </div>
  );
}