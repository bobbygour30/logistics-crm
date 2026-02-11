// src/components/TicketList.tsx
import { useState, useEffect } from "react";
import { Ticket } from "../lib/types";
import {
  Calendar,
  User,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type TicketListProps = {
  onTicketClick: (ticket: Ticket) => void;
  statusFilter: "all" | "open" | "working" | "closed" | "satisfied";
  setStatusFilter?: (status: "all" | "open" | "working" | "closed" | "satisfied") => void;
};

const ITEMS_PER_PAGE = 10;

const statusColors: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  working: "bg-amber-100 text-amber-800",
  closed: "bg-gray-100 text-gray-800",
  satisfied: "bg-green-100 text-green-800",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-100 text-blue-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  urgent: "bg-red-100 text-red-800",
};

const typeLabels: Record<string, string> = {
  complaint: "Complaint",
  inquiry: "Inquiry",
  delivery_issue: "Delivery Issue",
  billing: "Billing",
  other: "Other",
  status_check: "Status Check",
};

const API_URL = import.meta.env.VITE_API_URL;

export function TicketList({
  onTicketClick,
  statusFilter,
  setStatusFilter,
}: TicketListProps) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Search & expandable
  const [searchQuery, setSearchQuery] = useState("");
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
    const interval = setInterval(fetchTickets, 30000);
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
      if (statusFilter !== "all" && ticket.status !== statusFilter) return false;
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
      {/* Filter Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by ticket #, title, customer, or GR No..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm hover:shadow-md"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter?.(e.target.value as typeof statusFilter);
              setCurrentPage(1);
            }}
            className="px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow shadow-sm hover:shadow-md min-w-[160px]"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="working">In Progress</option>
            <option value="closed">Closed</option>
            <option value="satisfied">Satisfied</option>
          </select>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="overflow-x-auto hidden md:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Ticket #
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                GR No
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Assigned
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-indigo-700 uppercase tracking-wider"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentTickets.map((ticket) => {
              const isExpanded = expandedRows.has(ticket.id);
              const grNo = ticket.tracking_number ?? undefined;
              const timeline = grNo ? timelines[grNo] || [] : [];
              const isLoadingTimeline = ticket.id in timelineLoading && timelineLoading[ticket.id];

              return (
                <>
                  <tr
                    key={ticket.id}
                    onClick={() => onTicketClick(ticket)}
                    className="hover:bg-indigo-50 cursor-pointer transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm font-medium text-indigo-900">
                        <AlertCircle className="w-4 h-4 text-indigo-500 mr-2" />
                        {ticket.ticket_number}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{ticket.title}</div>
                      {ticket.description && (
                        <div className="text-xs text-gray-600 mt-1 line-clamp-2">{ticket.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-700">
                      {grNo || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{ticket.customers?.name || "N/A"}</div>
                      <div className="text-xs text-gray-500">{ticket.customers?.phone || ""}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {typeLabels[ticket.type] || ticket.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                          priorityColors[ticket.priority] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-3 py-1 text-xs font-semibold rounded-full shadow-sm ${
                          statusColors[ticket.status] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <User className="w-4 h-4 text-indigo-500 mr-1" />
                        {ticket.agents?.name || "Unassigned"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 text-indigo-500 mr-1" />
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </div>
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
                      <td colSpan={10} className="px-6 py-4 bg-indigo-50">
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

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {currentTickets.map((ticket) => {
            const isExpanded = expandedRows.has(ticket.id);
            const grNo = ticket.tracking_number ?? undefined;
            const timeline = grNo ? timelines[grNo] || [] : [];
            const isLoadingTimeline = ticket.id in timelineLoading && timelineLoading[ticket.id];

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
                    {ticket.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-700">
                  <div>GR No: {grNo || "—"}</div>
                  <div>
                    Priority:{" "}
                    <span
                      className={`px-1 py-0.5 text-xs rounded ${
                        priorityColors[ticket.priority] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {ticket.priority}
                    </span>
                  </div>
                  <div>Customer: {ticket.customers?.name || "N/A"}</div>
                  <div>Type: {typeLabels[ticket.type] || ticket.type}</div>
                  <div>Assigned: {ticket.agents?.name || "Unassigned"}</div>
                  <div>Created: {new Date(ticket.created_at).toLocaleDateString()}</div>
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