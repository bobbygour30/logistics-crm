import { useState, useEffect, useCallback } from 'react';
import { Search, Clock, AlertTriangle, CheckCircle, Truck, Calendar, ChevronLeft, ChevronRight , Loader2} from 'lucide-react';
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
}

const API_URL = import.meta.env.VITE_API_URL;
const ITEMS_PER_PAGE = 20;

export function AllGRs() {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [filterNew, setFilterNew] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchConsignments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      
      if (filterNew) {
        params.append('new', 'true');
      }
      
      const res = await fetch(`${API_URL}/api/consignments?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch GRs: ${res.status}`);
      const data = await res.json();
      setConsignments(data.consignments || []);
      setTotalCount(data.total || 0);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(msg);
      console.error('Fetch GRs error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, filterNew]);

  useEffect(() => {
    fetchConsignments();
  }, [fetchConsignments]);

  // Auto-refresh every 2 minutes
  useEffect(() => {
    const interval = setInterval(fetchConsignments, 120000);
    return () => clearInterval(interval);
  }, [fetchConsignments]);

  // Export to Excel (fetch all filtered data)
  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        limit: '1000', // Get up to 1000 for export
      });
      
      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }
      
      if (filterNew) {
        params.append('new', 'true');
      }
      
      const res = await fetch(`${API_URL}/api/consignments?${params}`);
      if (!res.ok) throw new Error('Failed to fetch data for export');
      const data = await res.json();
      
      if (data.consignments.length === 0) {
        alert('No GRs to export');
        return;
      }
      
      const exportData = data.consignments.map((item: Consignment) => ({
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
    } catch (err) {
      console.error('Export error:', err);
      alert('Failed to export data');
    } finally {
      setLoading(false);
    }
  };

  // Pagination handlers
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isNewlyAdded = (createdAt: string) => {
    const created = new Date(createdAt).getTime();
    const now = Date.now();
    return (now - created) < 24 * 60 * 60 * 1000;
  };

  if (loading && consignments.length === 0) {
    return (
      <div className="p-6 text-center text-gray-600">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-2"></div>
        Loading GRs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600 mb-4">Error: {error}</p>
        <button
          onClick={fetchConsignments}
          className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 bg-gray-50 min-h-screen">
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Truck className="text-blue-600 w-8 h-8" />
        All GRs in Database ({totalCount})
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
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filterNew}
                  onChange={(e) => {
                    setFilterNew(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                />
                <Clock className="w-4 h-4 text-amber-600" />
                Newly Added (Last 24h)
              </label>
              <button
                onClick={exportToExcel}
                disabled={totalCount === 0 || loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 min-w-[140px] justify-center"
              >
                <Download className="w-4 h-4" />
                Export Excel
              </button>
            </div>
          </div>
          {loading && (
            <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="animate-spin w-4 h-4" />
              Refreshing...
            </div>
          )}
        </div>

        {/* Table */}
        {consignments.length === 0 ? (
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
                  {consignments.map((gr) => {
                    const isNew = isNewlyAdded(gr.createdAt);
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
                            className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${
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
                            <Calendar className="w-4 h-4 text-gray-400 mr-2 flex-shrink-0" />
                            <span className="truncate max-w-[150px]">
                              {new Date(gr.createdAt).toLocaleString('en-IN', { 
                                dateStyle: 'medium', 
                                timeStyle: 'short' 
                              })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(gr.updatedAt).toLocaleString('en-IN', { 
                            dateStyle: 'medium', 
                            timeStyle: 'short' 
                          })}
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
              <div className="px-6 py-4 bg-gray-50 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700 order-2 sm:order-1">
                  Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{' '}
                  {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} GRs
                </div>
                <div className="flex items-center gap-2 order-1 sm:order-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white transition-colors"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-5 h-5" />
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