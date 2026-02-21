// src/components/TicketList.tsx (updated - changed auto-refresh interval to 5 minutes = 300000ms; no other changes)
import { useState, useEffect } from 'react';
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
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'working' | 'closed' | 'satisfied'>('all');
  const [colorFilter, setColorFilter] = useState<'all' | 'yellow' | 'orange' | 'red' | 'green'>('all');
  const [originQuery, setOriginQuery] = useState<string>('');
  const [destinationQuery, setDestinationQuery] = useState<string>('');
  const [delayFilter, setDelayFilter] = useState<'all' | '<24h' | '24-72h' | '>72h'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Expandable timeline
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [timelines, setTimelines] = useState<Record<string, any[]>>({});
  const [timelineLoading, setTimelineLoading] = useState<Record<string, boolean>>({});

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/tickets`);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setTickets(data.tickets || []);
      setCurrentPage(1);
    } catch (err: any) {
      setError(err.message || "Failed to load tickets");
    } finally {
      setLoading(false);
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
    fetchTickets();
    const interval = setInterval(fetchTickets, 300000); // Updated to 5 minutes (300000 ms)
    return () => clearInterval(interval);
  }, []);

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

  // Filter & sort
  const filteredTickets = tickets
    .filter((ticket) => {
      // Status filter
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
      // Color filter
      if (colorFilter !== "all" && (ticket.color ?? 'yellow') !== colorFilter) return false;
      // Origin filter
      if (originQuery && (ticket.origin ?? '').toLowerCase().includes(originQuery.toLowerCase()) === false) return false;
      // Destination filter
      if (destinationQuery && (ticket.destination ?? '').toLowerCase().includes(destinationQuery.toLowerCase()) === false) return false;
      // Delay filter
      const delayHours = ticket.delay_duration_minutes ? Math.floor(ticket.delay_duration_minutes / 60) : 0;
      if (delayFilter === '<24h' && delayHours >= 24) return false;
      if (delayFilter === '24-72h' && (delayHours < 24 || delayHours > 72)) return false;
      if (delayFilter === '>72h' && delayHours <= 72) return false;
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      return (
        ticket.ticket_number.toLowerCase().includes(searchLower) ||
        ticket.title.toLowerCase().includes(searchLower) ||
        (ticket.tracking_number?.toLowerCase().includes(searchLower) ?? false) ||
        (ticket.customers?.name?.toLowerCase().includes(searchLower) ?? false)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at);
      const dateB = new Date(b.updated_at || b.created_at);
      return dateB.getTime() - dateA.getTime();
    });

  // Compute stats (synced with current filters)
  const statusStats = {
    total: filteredTickets.length,
    open: filteredTickets.filter(t => t.status === 'open').length,
    working: filteredTickets.filter(t => t.status === 'working').length,
    closed: filteredTickets.filter(t => t.status === 'closed').length,
    satisfied: filteredTickets.filter(t => t.status === 'satisfied').length,
  };

  const colorStats = {
    yellow: filteredTickets.filter(t => (t.color ?? 'yellow') === 'yellow').length,
    orange: filteredTickets.filter(t => t.color === 'orange').length,
    red: filteredTickets.filter(t => t.color === 'red').length,
    green: filteredTickets.filter(t => t.color === 'green').length,
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredTickets.length === 0) {
      alert("No tickets to export");
      return;
    }

    const exportData = filteredTickets.map((ticket) => {
      const delayedHours = ticket.last_movement_date 
        ? Math.floor((Date.now() - new Date(ticket.last_movement_date).getTime()) / (1000 * 60 * 60))
        : 0;

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

    const colWidths = [
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 20 },
    ];
    worksheet["!cols"] = colWidths;

    XLSX.writeFile(workbook, `tickets_export_${new Date().toISOString().slice(0,10)}.xlsx`);
  };

  // Pagination
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
      {/* Stats Overview - synced with filters */}
      <StatsOverview
        statusStats={statusStats}
        colorStats={colorStats}
        onStatusClick={(status) => {
          setStatusFilter(status);
          // Reset other filters when clicking stat
          setColorFilter('all');
          setOriginQuery('');
          setDestinationQuery('');
          setDelayFilter('all');
          setCurrentPage(1);
        }}
        onColorClick={(color) => {
          setColorFilter(color);
          // Reset other filters when clicking color stat
          setStatusFilter('all');
          setOriginQuery('');
          setDestinationQuery('');
          setDelayFilter('all');
          setCurrentPage(1);
        }}
      />

      {/* Filter Bar */}
      <FilterBar
        statusFilter={statusFilter}
        colorFilter={colorFilter}
        originQuery={originQuery}
        destinationQuery={destinationQuery}
        delayFilter={delayFilter}
        searchQuery={searchQuery}
        onStatusChange={(status) => {
          setStatusFilter(status);
          setCurrentPage(1);
        }}
        onColorChange={(color) => {
          setColorFilter(color);
          setCurrentPage(1);
        }}
        onOriginChange={(origin) => {
          setOriginQuery(origin);
          setCurrentPage(1);
        }}
        onDestinationChange={(destination) => {
          setDestinationQuery(destination);
          setCurrentPage(1);
        }}
        onDelayChange={(delay) => {
          setDelayFilter(delay);
          setCurrentPage(1);
        }}
        onSearchChange={(query) => {
          setSearchQuery(query);
          setCurrentPage(1);
        }}
      />

      {/* Export Button */}
      <div className="px-6 py-4 bg-white border-b border-gray-200">
        <button
          onClick={exportToExcel}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to Excel ({filteredTickets.length} tickets)
        </button>
      </div>

      {/* Desktop Table - updated columns */}
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
              const delayedHours = ticket.last_movement_date 
                ? Math.floor((Date.now() - new Date(ticket.last_movement_date).getTime()) / (1000 * 60 * 60))
                : 0;
              const bookingTime = ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString() : 'N/A';
              const displayColor = ticket.color ?? 'yellow';  // Safe fallback
              const delayHoursForDisplay = ticket.delay_duration_minutes ? Math.floor(ticket.delay_duration_minutes / 60) : 0;

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

      {/* Mobile Cards - updated columns */}
      <div className="md:hidden divide-y divide-gray-200">
        {currentTickets.map((ticket) => {
          const isExpanded = expandedRows.has(ticket.id);
          const grNo = ticket.tracking_number ?? undefined;
          const timeline = grNo ? timelines[grNo] || [] : [];
          const isLoadingTimeline = ticket.id in timelineLoading && timelineLoading[ticket.id];
          const delayedHours = ticket.last_movement_date 
            ? Math.floor((Date.now() - new Date(ticket.last_movement_date).getTime()) / (1000 * 60 * 60))
            : 0;
          const bookingTime = ticket.created_at ? new Date(ticket.created_at).toLocaleTimeString() : 'N/A';
          const displayColor = ticket.color ?? 'yellow';  // Safe fallback

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

      {/* Pagination */}
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
              aria-label="Previous page"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-sm font-medium">
              Page {currentPage} of {totalPages || 1}
            </span>

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

      {filteredTickets.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No tickets found</p>
        </div>
      )}
    </div>
  );
}