// src/components/TicketList.tsx (OPTIMIZED - Combined stats computation, debounced text filters, consistent delay calc, removed unused memos)
import { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Ticket } from "../lib/types";
import { FilterBar } from './FilterBar';
import { StatsOverview } from './StatsOverview';

const ITEMS_PER_PAGE = 10;

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

export function TicketList({ onTicketClick }: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'working' | 'closed' | 'satisfied'>('all');
  const [colorFilter, setColorFilter] = useState<'all' | 'yellow' | 'orange' | 'red' | 'green'>('all');
  const [originQuery, setOriginQuery] = useState<string>('');
  const [debouncedOriginQuery, setDebouncedOriginQuery] = useState<string>('');
  const [destinationQuery, setDestinationQuery] = useState<string>('');
  const [debouncedDestinationQuery, setDebouncedDestinationQuery] = useState<string>('');
  const [delayFilter, setDelayFilter] = useState<'all' | '<24h' | '24-72h' | '>72h'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Expandable timeline
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [timelines, setTimelines] = useState<Record<string, any[]>>({});
  const [timelineLoading, setTimelineLoading] = useState<Record<string, boolean>>({});

  const fetchTickets = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/api/tickets`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setTickets(data.tickets || []);
      if (!silent) setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      if (!silent) setLoading(false);
      else setIsRefreshing(false);
    }
  };

  const fetchTimeline = async (grNo: string, ticketId: string) => {
    if (timelines[grNo]) return;
    setTimelineLoading((prev) => ({ ...prev, [ticketId]: true }));

    try {
      const res = await fetch(`${API_URL}/api/consignments/${encodeURIComponent(grNo)}`);
      if (!res.ok) throw new Error(`Failed to fetch consignment: ${res.status}`);
      const cons = await res.json();
      setTimelines((prev) => ({
        ...prev,
        [grNo]: cons.trackingRaw?.consignmentactivitylist || [],
      }));
    } catch (err: any) {
      console.error(`Failed to load timeline for GR ${grNo}:`, err.message);
    } finally {
      setTimelineLoading((prev) => ({ ...prev, [ticketId]: false }));
    }
  };

  useEffect(() => {
    fetchTickets(false);
    const interval = setInterval(() => fetchTickets(true), 300000);
    return () => clearInterval(interval);
  }, []);

  // Debounce text filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedOriginQuery(originQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [originQuery]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedDestinationQuery(destinationQuery);
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [destinationQuery]);

  const toggleRow = (ticketId: string, grNo?: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(ticketId)) {
      newExpanded.delete(ticketId);
    } else {
      newExpanded.add(ticketId);
      if (grNo) fetchTimeline(grNo, ticketId);
    }
    setExpandedRows(newExpanded);
  };

  const sortedTickets = useMemo(() => {
    return [...tickets].sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at || 0);
      const dateB = new Date(b.updated_at || b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }, [tickets]);

  // ────────────────────────────────────────────────
  // SAFE color helper — MUST be declared BEFORE useMemo that uses it
  // ────────────────────────────────────────────────
  const getColor = (ticket: Ticket): string =>
    (ticket as any).ticket_color ?? (ticket as any).color ?? 'yellow';

  // Optimized global stats — single loop over all tickets
  const globalStats = useMemo(() => {
    const statusCounts = {
      total: sortedTickets.length,
      open: 0,
      working: 0,
      closed: 0,
      satisfied: 0,
    };
    const colorCounts = {
      yellow: 0,
      orange: 0,
      red: 0,
      green: 0,
    };

    sortedTickets.forEach((ticket) => {
      const status = ticket.status;
      switch (status) {
        case 'open':
          statusCounts.open++;
          break;
        case 'working':
          statusCounts.working++;
          break;
        case 'closed':
          statusCounts.closed++;
          break;
        case 'satisfied':
          statusCounts.satisfied++;
          break;
      }

      const color = getColor(ticket);
      switch (color) {
        case 'yellow':
          colorCounts.yellow++;
          break;
        case 'orange':
          colorCounts.orange++;
          break;
        case 'red':
          colorCounts.red++;
          break;
        case 'green':
          colorCounts.green++;
          break;
      }
    });

    return {
      statusStats: statusCounts,
      colorStats: colorCounts,
    };
  }, [sortedTickets]);

  const filteredTickets = useMemo(() => {
    return sortedTickets.filter((ticket) => {
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      if (colorFilter !== "all" && getColor(ticket) !== colorFilter) return false;

      if (debouncedOriginQuery && !(ticket.origin ?? '').toLowerCase().includes(debouncedOriginQuery.toLowerCase())) return false;
      if (debouncedDestinationQuery && !(ticket.destination ?? '').toLowerCase().includes(debouncedDestinationQuery.toLowerCase())) return false;

      const delayHours = ticket.delay_duration_minutes ? Math.floor(ticket.delay_duration_minutes / 60) : 0;
      if (delayFilter === '<24h' && delayHours >= 24) return false;
      if (delayFilter === '24-72h' && (delayHours < 24 || delayHours > 72)) return false;
      if (delayFilter === '>72h' && delayHours <= 72) return false;

      const searchLower = debouncedSearchQuery.toLowerCase();
      return (
        ticket.ticket_number.toLowerCase().includes(searchLower) ||
        ticket.title.toLowerCase().includes(searchLower) ||
        (ticket.tracking_number?.toLowerCase().includes(searchLower) ?? false) ||
        (ticket.customers?.name?.toLowerCase().includes(searchLower) ?? false)
      );
    });
  }, [sortedTickets, statusFilter, colorFilter, debouncedOriginQuery, debouncedDestinationQuery, delayFilter, debouncedSearchQuery]);

  useEffect(() => {
    const totalPages = Math.ceil(filteredTickets.length / ITEMS_PER_PAGE);
    if (filteredTickets.length === 0) {
      if (currentPage !== 1) setCurrentPage(1);
    } else if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [filteredTickets.length, currentPage]);

  const exportToExcel = () => {
    if (filteredTickets.length === 0) {
      alert("No tickets to export");
      return;
    }
    const exportData = filteredTickets.map((ticket) => {
      const delayedHours = ticket.delay_duration_minutes ? Math.floor(ticket.delay_duration_minutes / 60) : 0;
      return {
        "GR No": ticket.tracking_number || "N/A",
        "Booking Date": ticket.gr_date || "N/A",
        "Booking Time": ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString() : "N/A",
        "Destination Location": ticket.destination || "N/A",
        "Delayed By (Hours)": delayedHours,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tickets");
    worksheet["!cols"] = [{ wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 }];
    XLSX.writeFile(workbook, `tickets_export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  const totalItems = filteredTickets.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentTickets = filteredTickets.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setExpandedRows(new Set());
    }
  };

  if (loading) return <div className="p-6 text-center text-gray-600">Loading tickets...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl shadow-lg overflow-hidden">
      <StatsOverview
        statusStats={globalStats.statusStats}
        colorStats={globalStats.colorStats}
        onStatusClick={(status) => {
          setStatusFilter(status);
          setColorFilter('all');
          setOriginQuery('');
          setDestinationQuery('');
          setDelayFilter('all');
          setCurrentPage(1);
        }}
        onColorClick={(color) => {
          setColorFilter(color);
          setStatusFilter('all');
          setOriginQuery('');
          setDestinationQuery('');
          setDelayFilter('all');
          setCurrentPage(1);
        }}
      />

      <FilterBar
        statusFilter={statusFilter}
        colorFilter={colorFilter}
        originQuery={originQuery}
        destinationQuery={destinationQuery}
        delayFilter={delayFilter}
        searchQuery={searchQuery}
        onStatusChange={(status) => { setStatusFilter(status); setCurrentPage(1); }}
        onColorChange={(color) => { setColorFilter(color); setCurrentPage(1); }}
        onOriginChange={(origin) => { setOriginQuery(origin); setCurrentPage(1); }}
        onDestinationChange={(destination) => { setDestinationQuery(destination); setCurrentPage(1); }}
        onDelayChange={(delay) => { setDelayFilter(delay); setCurrentPage(1); }}
        onSearchChange={(query) => { setSearchQuery(query); setCurrentPage(1); }}
      />

      {isRefreshing && (
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2 text-blue-700 text-xs">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          Refreshing tickets...
        </div>
      )}

      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to Excel ({filteredTickets.length} tickets)
        </button>
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
            {currentTickets.map((ticket) => {
              const isExpanded = expandedRows.has(ticket.id);
              const grNo = ticket.tracking_number ?? undefined;
              const timeline = grNo ? timelines[grNo] || [] : [];
              const isLoadingTimeline = ticket.id in timelineLoading && timelineLoading[ticket.id];
              const delayedHours = ticket.delay_duration_minutes ? Math.floor(ticket.delay_duration_minutes / 60) : 0;
              const bookingTime = ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString() : 'N/A';
              const displayColor = getColor(ticket);

              return (
                <>
                  <tr
                    key={ticket.id}
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
                          <p className="text-gray-600 text-sm">Loading timeline...</p>
                        ) : timeline.length > 0 ? (
                          <div className="space-y-4 max-h-64 overflow-y-auto pr-4">
                            {timeline.map((activity: any, index: number) => (
                              <div key={index} className="border-l-4 border-indigo-500 pl-4 relative">
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
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-gray-200">
        {currentTickets.map((ticket) => {
          const isExpanded = expandedRows.has(ticket.id);
          const grNo = ticket.tracking_number ?? undefined;
          const timeline = grNo ? timelines[grNo] || [] : [];
          const isLoadingTimeline = ticket.id in timelineLoading && timelineLoading[ticket.id];
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
                    <p className="text-gray-600 text-sm">Loading...</p>
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

      {totalItems > 0 && (
        <div className="px-6 py-4 bg-white border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-700 order-2 sm:order-1">
            Showing <span className="font-medium">{startIndex + 1}</span> to{" "}
            <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{" "}
            <span className="font-medium">{totalItems}</span> tickets
          </div>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium">Page {currentPage} of {totalPages || 1}</span>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {filteredTickets.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tickets found</p>
        </div>
      )}
    </div>
  );
}