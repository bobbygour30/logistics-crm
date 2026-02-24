// src/components/TicketList.tsx
import { useState, useEffect, useMemo, useCallback, memo, useRef, useReducer } from 'react';
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Ticket } from "../lib/types";
import { FilterBar } from './FilterBar';
import { StatsOverview } from './StatsOverview';

const ITEMS_PER_PAGE = 20; // Increased for better performance
const DEBOUNCE_MS = 500;
const MAX_CONCURRENT_TIMELINE = 3;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-800 border border-red-300",
  working: "bg-amber-100 text-amber-800 border border-amber-300",
  closed: "bg-gray-200 text-gray-800 border border-gray-300",
  satisfied: "bg-green-100 text-green-800 border border-green-300 font-semibold",
};

const colorColors: Record<string, string> = {
  yellow: "bg-yellow-100 text-yellow-800",
  orange: "bg-orange-100 text-orange-800",
  red: "bg-red-100 text-red-800",
  green: "bg-green-100 text-green-800",
};

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

type TicketListProps = {
  onTicketClick: (ticket: Ticket) => void;
};

// Cache for timeline data
const timelineCache = new Map<string, { data: any[]; timestamp: number }>();

// Reducer for state management
type State = {
  tickets: Ticket[];
  totalCount: number;
  loading: boolean;
  error: string | null;
  stats: {
    statusStats: { total: number; open: number; working: number; closed: number; satisfied: number };
    colorStats: { yellow: number; orange: number; red: number; green: number };
  } | null;
};

type Action =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: { tickets: Ticket[]; total: number; stats: State['stats'] } }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' };

const initialState: State = {
  tickets: [],
  totalCount: 0,
  loading: false,
  error: null,
  stats: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        tickets: action.payload.tickets,
        totalCount: action.payload.total,
        stats: action.payload.stats,
        loading: false,
        error: null,
      };
    case 'FETCH_ERROR':
      return { ...state, loading: false, error: action.payload };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    default:
      return state;
  }
}

function getColor(ticket: Ticket): string {
  return (ticket as any).ticket_color ?? (ticket as any).color ?? 'yellow';
}

// Memoized row component
const TimelineRow = memo(({
  ticket,
  isExpanded,
  toggleRow,
  timeline,
  isLoadingTimeline,
  onTicketClick,
}: {
  ticket: Ticket;
  isExpanded: boolean;
  toggleRow: (id: string, grNo?: string) => void;
  timeline: any[];
  isLoadingTimeline: boolean;
  onTicketClick: (ticket: Ticket) => void;
}) => {
  const grNo = ticket.tracking_number ?? undefined;
  const delayedHours = ticket.delay_duration_minutes
    ? Math.floor(ticket.delay_duration_minutes / 60)
    : 0;
  const bookingTime = ticket.created_at
    ? new Date(ticket.created_at).toLocaleTimeString()
    : 'N/A';
  const displayColor = getColor(ticket);

  return (
    <>
      <tr
        onClick={() => onTicketClick(ticket)}
        className="hover:bg-indigo-50 cursor-pointer transition-colors duration-200"
      >
        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-700">
          {ticket.tracking_number || 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {ticket.gr_date || 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {bookingTime}
        </td>
        <td className="px-6 py-4 text-sm text-gray-900">
          {ticket.destination || 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
          {delayedHours}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
              colorColors[displayColor] || "bg-gray-100 text-gray-800"
            }`}
          >
            {displayColor.charAt(0).toUpperCase() + displayColor.slice(1)}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleRow(ticket.id, grNo);
            }}
            className="text-indigo-600 hover:text-indigo-900 transition-colors"
            aria-label={isExpanded ? "Hide timeline" : "Show timeline"}
          >
            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </td>
      </tr>

      {isExpanded && grNo && (
        <tr>
          <td colSpan={7} className="px-6 py-4 bg-indigo-50">
            <h4 className="text-sm font-semibold text-indigo-900 mb-3">
              Latest Booking Timeline for GR {grNo}
            </h4>
            {isLoadingTimeline ? (
              <div className="flex items-center gap-2 text-gray-600 text-sm">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                Loading timeline...
              </div>
            ) : timeline.length > 0 ? (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-4">
                {timeline.map((activity: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-indigo-500 pl-4 relative">
                    <div className="absolute -left-2 top-1.5 w-4 h-4 bg-indigo-500 rounded-full border-2 border-white shadow" />
                    <p className="font-medium text-indigo-900 text-sm">{activity.activity}</p>
                    <p className="text-xs text-gray-600">{activity.date}</p>
                    <p className="text-xs text-gray-700 mt-1">{activity.details}</p>
                    {activity.documentno && (
                      <p className="text-xs text-indigo-600 mt-1">Document: {activity.documentno}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-sm italic">No timeline activities available</p>
            )}
          </td>
        </tr>
      )}
    </>
  );
});

TimelineRow.displayName = 'TimelineRow';

export function TicketList({ onTicketClick }: TicketListProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'working' | 'closed' | 'satisfied'>('all');
  const [colorFilter, setColorFilter] = useState<'all' | 'yellow' | 'orange' | 'red' | 'green'>('all');
  const [originQuery, setOriginQuery] = useState('');
  const [debouncedOrigin, setDebouncedOrigin] = useState('');
  const [destinationQuery, setDestinationQuery] = useState('');
  const [debouncedDestination, setDebouncedDestination] = useState('');
  const [delayFilter, setDelayFilter] = useState<'all' | '<24h' | '24-72h' | '>72h'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  
  // UI state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [timelines, setTimelines] = useState<Record<string, any[]>>({});
  const [timelineLoading, setTimelineLoading] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Concurrency control for timeline fetches
  const pendingTimelineFetches = useRef<string[]>([]);
  const activeFetches = useRef(0);

  const processTimelineQueue = useCallback(() => {
    if (activeFetches.current >= MAX_CONCURRENT_TIMELINE) return;
    const grNo = pendingTimelineFetches.current.shift();
    if (!grNo) return;

    // Check cache first
    const cached = timelineCache.get(grNo);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setTimelines(prev => ({ ...prev, [grNo]: cached.data }));
      processTimelineQueue();
      return;
    }

    activeFetches.current++;
    setTimelineLoading((prev) => ({ ...prev, [grNo]: true }));

    fetch(`${API_URL}/api/consignments/${encodeURIComponent(grNo)}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        const timelineData = data.trackingRaw?.consignmentactivitylist || [];
        timelineCache.set(grNo, { data: timelineData, timestamp: Date.now() });
        setTimelines((prev) => ({ ...prev, [grNo]: timelineData }));
      })
      .catch((err) => console.warn(`Timeline fetch failed for ${grNo}:`, err))
      .finally(() => {
        activeFetches.current--;
        setTimelineLoading((prev) => ({ ...prev, [grNo]: false }));
        processTimelineQueue();
      });
  }, []);

  const fetchTimeline = useCallback(
    (grNo: string) => {
      if (timelines[grNo] || timelineLoading[grNo]) return;
      
      // Check cache again before queueing
      const cached = timelineCache.get(grNo);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setTimelines(prev => ({ ...prev, [grNo]: cached.data }));
        return;
      }
      
      pendingTimelineFetches.current.push(grNo);
      processTimelineQueue();
    },
    [timelines, timelineLoading, processTimelineQueue]
  );

  // Build query params for API
  const getQueryParams = useCallback(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: ITEMS_PER_PAGE.toString(),
    });

    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (colorFilter !== 'all') params.append('color', colorFilter);
    if (debouncedOrigin) params.append('origin', debouncedOrigin);
    if (debouncedDestination) params.append('destination', debouncedDestination);
    if (delayFilter !== 'all') params.append('delay', delayFilter);
    if (debouncedSearch) params.append('search', debouncedSearch);

    return params;
  }, [currentPage, statusFilter, colorFilter, debouncedOrigin, debouncedDestination, delayFilter, debouncedSearch]);

  // Fetch tickets with pagination
  const fetchTickets = useCallback(async (silent = false) => {
    if (!silent) {
      dispatch({ type: 'FETCH_START' });
    } else {
      setIsRefreshing(true);
    }

    try {
      const params = getQueryParams();
      const res = await fetch(`${API_URL}/api/tickets?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      dispatch({
        type: 'FETCH_SUCCESS',
        payload: {
          tickets: data.tickets,
          total: data.total,
          stats: data.stats,
        },
      });
    } catch (err: any) {
      dispatch({ type: 'FETCH_ERROR', payload: err.message || "Failed to load tickets" });
    } finally {
      if (silent) setIsRefreshing(false);
    }
  }, [getQueryParams]);

  // Debounce filters
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOrigin(originQuery), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [originQuery]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedDestination(destinationQuery), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [destinationQuery]);

  // Fetch when filters or pagination change
  useEffect(() => {
    fetchTickets(false);
  }, [currentPage, statusFilter, colorFilter, debouncedOrigin, debouncedDestination, delayFilter, debouncedSearch]);

  // Background refresh
  useEffect(() => {
    const interval = setInterval(() => fetchTickets(true), 300000);
    return () => clearInterval(interval);
  }, [fetchTickets]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
    setExpandedRows(new Set());
  }, [statusFilter, colorFilter, debouncedOrigin, debouncedDestination, delayFilter, debouncedSearch]);

  const toggleRow = useCallback(
    (ticketId: string, grNo?: string) => {
      setExpandedRows((prev) => {
        const next = new Set(prev);
        if (next.has(ticketId)) {
          next.delete(ticketId);
        } else {
          next.add(ticketId);
          if (grNo) fetchTimeline(grNo);
        }
        return next;
      });
    },
    [fetchTimeline]
  );

  const exportToExcel = useCallback(async () => {
    try {
      // Fetch all filtered data for export
      const params = getQueryParams();
      params.set('page', '1');
      params.set('limit', state.totalCount.toString());
      
      const res = await fetch(`${API_URL}/api/tickets/export?${params}`);
      if (!res.ok) throw new Error('Failed to fetch export data');
      
      const data = await res.json();
      
      const exportData = data.tickets.map((t: any) => ({
        "GR No": t.tracking_number || "N/A",
        "Booking Date": t.gr_date || "N/A",
        "Booking Time": t.created_at ? new Date(t.created_at).toLocaleTimeString() : "N/A",
        "Destination Location": t.destination || "N/A",
        "Delayed By (Hours)": t.delay_duration_minutes ? Math.floor(t.delay_duration_minutes / 60) : 0,
        "Status": t.status,
        "Color": getColor(t),
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Tickets");
      ws["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 10 }];
      XLSX.writeFile(wb, `tickets_export_${new Date().toISOString().slice(0, 10)}.xlsx`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export tickets. Please try again.');
    }
  }, [getQueryParams, state.totalCount]);

  const totalPages = Math.ceil(state.totalCount / ITEMS_PER_PAGE);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
        setExpandedRows(new Set());
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [totalPages]
  );

  if (state.loading && state.tickets.length === 0) {
    return (
      <div className="p-6 text-center">
        <div className="inline-flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          Loading tickets...
        </div>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-red-600 mb-4">Error: {state.error}</p>
        <button
          onClick={() => fetchTickets(false)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg overflow-hidden">
      {state.stats && (
       <StatsOverview
  statusStats={state.stats.statusStats}
  colorStats={state.stats.colorStats}
  onColorClick={(color) => {
    setColorFilter(color);
    // Optionally reset other filters when changing color
    setStatusFilter('all');
    setOriginQuery('');
    setDestinationQuery('');
    setDelayFilter('all');
    setSearchQuery('');
  }}
/>
      )}

      <FilterBar
        statusFilter={statusFilter}
        colorFilter={colorFilter}
        originQuery={originQuery}
        destinationQuery={destinationQuery}
        delayFilter={delayFilter}
        searchQuery={searchQuery}
        onStatusChange={setStatusFilter}
        onColorChange={setColorFilter}
        onOriginChange={setOriginQuery}
        onDestinationChange={setDestinationQuery}
        onDelayChange={setDelayFilter}
        onSearchChange={setSearchQuery}
      />

      {isRefreshing && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-blue-700 text-xs">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Refreshing tickets...
        </div>
      )}

      <div className="px-6 py-4 bg-white border-b border-gray-200 flex justify-between items-center">
        <button
          onClick={exportToExcel}
          disabled={state.tickets.length === 0}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to Excel ({state.totalCount} tickets)
        </button>
        
        <div className="text-sm text-gray-600">
          Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, state.totalCount)} of {state.totalCount}
        </div>
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">GR No</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Booking Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Booking Time</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Destination Location</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Delayed By (Hours)</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">Color</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {state.tickets.map((ticket) => {
              const isExpanded = expandedRows.has(ticket.id);
              const timeline = ticket.tracking_number ? timelines[ticket.tracking_number] || [] : [];
              const isLoadingTimeline = ticket.tracking_number ? !!timelineLoading[ticket.tracking_number] : false;

              return (
                <TimelineRow
                  key={ticket.id}
                  ticket={ticket}
                  isExpanded={isExpanded}
                  toggleRow={toggleRow}
                  timeline={timeline}
                  isLoadingTimeline={isLoadingTimeline}
                  onTicketClick={onTicketClick}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {state.tickets.map((ticket) => {
          const isExpanded = expandedRows.has(ticket.id);
          const grNo = ticket.tracking_number ?? undefined;
          const timeline = grNo ? timelines[grNo] || [] : [];
          const isLoadingTimeline = grNo ? timelineLoading[grNo] : false;
          const delayedHours = ticket.delay_duration_minutes ? Math.floor(ticket.delay_duration_minutes / 60) : 0;
          const bookingTime = ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString() : 'N/A';
          const displayColor = getColor(ticket);

          return (
            <div key={ticket.id} className="p-4 space-y-3 hover:bg-indigo-50 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm font-medium text-indigo-900">{ticket.ticket_number}</div>
                  <div className="text-xs text-gray-600">{ticket.title}</div>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    statusColors[ticket.status] || "bg-gray-100 text-gray-800"
                  }`}
                >
                  {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                <div>GR No: {grNo || "N/A"}</div>
                <div>Booking Date: {ticket.gr_date || "N/A"}</div>
                <div>Booking Time: {bookingTime}</div>
                <div>Destination: {ticket.destination || "N/A"}</div>
                <div>Delayed (Hours): {delayedHours}</div>
                <div>
                  Color:{" "}
                  <span
                    className={`px-1 py-0.5 text-xs rounded ${
                      colorColors[displayColor] || "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {displayColor.charAt(0).toUpperCase() + displayColor.slice(1)}
                  </span>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleRow(ticket.id, grNo);
                }}
                className="w-full mt-2 py-2 bg-indigo-100 text-indigo-900 rounded-lg flex items-center justify-center text-sm font-medium hover:bg-indigo-200 transition-colors"
              >
                {isExpanded ? "Hide Timeline" : "Show Timeline"}{" "}
                {isExpanded ? <ChevronUp className="ml-2 w-4 h-4" /> : <ChevronDown className="ml-2 w-4 h-4" />}
              </button>

              {isExpanded && grNo && (
                <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-indigo-900 mb-3">
                    Latest Booking Timeline for GR {grNo}
                  </h4>
                  {isLoadingTimeline ? (
                    <div className="flex items-center gap-2 text-gray-600 text-sm">
                      <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </div>
                  ) : timeline.length > 0 ? (
                    <div className="space-y-4">
                      {timeline.map((activity: any, index: number) => (
                        <div key={index} className="border-l-4 border-indigo-500 pl-4 relative text-xs">
                          <div className="absolute -left-2 top-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-white" />
                          <p className="font-medium text-indigo-900">{activity.activity}</p>
                          <p className="text-gray-600">{activity.date}</p>
                          <p className="text-gray-700">{activity.details}</p>
                          {activity.documentno && (
                            <p className="text-indigo-600">Doc: {activity.documentno}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 italic">No activities</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {state.totalCount > 0 && (
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 order-2 sm:order-1">
            Showing <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> to{" "}
            <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, state.totalCount)}</span> of{" "}
            <span className="font-medium">{state.totalCount}</span> tickets
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
              aria-label="Next page"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {state.tickets.length === 0 && !state.loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tickets found</p>
        </div>
      )}
    </div>
  );
}