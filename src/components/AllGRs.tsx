// src/components/AllGRs.tsx
import { useState, useEffect } from 'react';
import { Search, Clock, AlertTriangle, CheckCircle, Truck, Calendar } from 'lucide-react';
import { Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Consignment {
  _id: string;
  GRNo: string;
  currentStatus: string;
  createdAt: string;
  updatedAt: string;
  delivered: boolean;
  origin?: string | null;
  destination?: string | null;
  location?: string | null;
  totalPackages?: number;
  consigneeName?: string | null;
  // Add more if needed from backend schema
}

const API_URL = import.meta.env.VITE_API_URL;

const ITEMS_PER_PAGE = 20; // Higher for GR list

export function AllGRs() {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterNew, setFilterNew] = useState<boolean>(false); // Newly added (last 24h)
  const [currentPage, setCurrentPage] = useState<number>(1);

  const fetchConsignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/consignments`);
      if (!res.ok) throw new Error(`Failed to fetch GRs: ${res.status}`);
      const data = await res.json();
      setConsignments(data.consignments || []);
      setCurrentPage(1);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      console.error('Fetch GRs error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsignments();
    const interval = setInterval(fetchConsignments, 60000); // Poll every 1 min for new GRs
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const now = new Date();
  const isNewlyAdded = (item: Consignment) => {
    const created = new Date(item.createdAt);
    return (now.getTime() - created.getTime()) < 24 * 60 * 60 * 1000; // Last 24h
  };

  const filteredConsignments = consignments
    .filter((item) => {
      if (filterNew && !isNewlyAdded(item)) return false;
      const query = searchQuery.toLowerCase();
      return (
        item.GRNo.toLowerCase().includes(query) ||
        (item.currentStatus || '').toLowerCase().includes(query) ||
        (item.origin || '').toLowerCase().includes(query) ||
        (item.destination || '').toLowerCase().includes(query) ||
        (item.consigneeName || '').toLowerCase().includes(query)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Newest first

  // Pagination
  const totalItems = filteredConsignments.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginated = filteredConsignments.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Export to Excel
  const exportToExcel = () => {
    if (filteredConsignments.length === 0) {
      alert('No GRs to export');
      return;
    }
    const exportData = filteredConsignments.map((item) => ({
      'GR No': item.GRNo,
      Status: item.currentStatus,
      'Created At': new Date(item.createdAt).toLocaleString('en-IN'),
      'Updated At': new Date(item.updatedAt).toLocaleString('en-IN'),
      Delivered: item.delivered ? 'Yes' : 'No',
      Origin: item.origin || '',
      Destination: item.destination || '',
      Location: item.location || '',
      Packages: item.totalPackages || '',
      Consignee: item.consigneeName || '',
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'All GRs');
    const colWidths = [
      { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 10 }, { wch: 20 },
    ];
    worksheet['!cols'] = colWidths;
    XLSX.writeFile(workbook, `all_grs_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
        Loading GRs...
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-red-600 text-center">Error: {error}</div>;
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Truck className="text-blue-600 w-8 h-8" />
        All GRs in Database
      </h2>

      <div className="space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl shadow p-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by GR No, status, origin, destination, or consignee..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="filterNew"
                checked={filterNew}
                onChange={(e) => {
                  setFilterNew(e.target.checked);
                  setCurrentPage(1);
                }}
                className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
              />
              <label htmlFor="filterNew" className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Clock className="w-4 h-4 text-amber-600" />
                Newly Added (Last 24h)
              </label>
            </div>
            <button
              onClick={exportToExcel}
              disabled={totalItems === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center"
            >
              <Download className="w-4 h-4" />
              Export Excel
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            Showing {totalItems} GRs {filterNew ? '(Newly Added)' : ''} • Sorted by creation date (newest first)
          </p>
        </div>

        {/* Table */}
        {totalItems === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {filterNew ? 'No newly added GRs in the last 24 hours.' : 'No GRs in the database yet.'}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">GR No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origin</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Packages</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consignee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {paginated.map((gr) => {
                    const isNew = isNewlyAdded(gr);
                    const isDelayed = (Date.now() - new Date(gr.updatedAt).getTime()) > 24 * 60 * 60 * 1000 && !gr.delivered;
                    return (
                      <tr key={gr._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-indigo-900">
                          {gr.GRNo}
                          {isNew && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3 mr-1" />
                              New
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              gr.delivered
                                ? 'bg-green-100 text-green-800'
                                : isDelayed
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {gr.currentStatus || 'In Transit'}
                            {!gr.delivered && isDelayed && (
                              <AlertTriangle className="ml-1 w-3 h-3" />
                            )}
                            {gr.delivered && <CheckCircle className="ml-1 w-3 h-3" />}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                            {new Date(gr.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(gr.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gr.origin || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gr.destination || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gr.totalPackages || '—'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{gr.consigneeName || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} GRs
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                  >
                    Previous
                  </button>
                  <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}