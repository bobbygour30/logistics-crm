// src/components/ConsignmentTracking.tsx
import { useState, useEffect } from 'react';
import { Search, Truck, Calendar, Package, Loader2 } from 'lucide-react';

/* ---------- helpers ---------- */
const Val = ({ v }: { v: any }) => (
  <span className="text-gray-800 font-medium">{v ?? '—'}</span>
);

const API_URL = import.meta.env.VITE_API_URL;
const CLIENT_ID = import.meta.env.VITE_GREENTRANS_CLIENT_ID;

/* ---------- component ---------- */
export function ConsignmentTracking() {
  const [grNo, setGrNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  // Tracked consignments from backend
  const [trackedConsignments, setTrackedConsignments] = useState<any[]>([]);
  const [loadingTracked, setLoadingTracked] = useState(true);

  // For showing details of a tracked GR
  const [selectedGr, setSelectedGr] = useState<string | null>(null);
  const [trackedDetailLoading, setTrackedDetailLoading] = useState(false);
  const [trackedDetailData, setTrackedDetailData] = useState<any>(null);
  const [trackedDetailError, setTrackedDetailError] = useState<string | null>(null);

  const loadTrackedConsignments = async () => {
    try {
      setLoadingTracked(true);
      const res = await fetch(`${API_URL}/api/consignments`);
      if (!res.ok) throw new Error('Failed to load tracked consignments');
      const json = await res.json();
      setTrackedConsignments(json.consignments || json || []);
    } catch (err) {
      console.error('Error loading tracked consignments:', err);
      setError('Could not load tracked consignments');
    } finally {
      setLoadingTracked(false);
    }
  };

  const fetchTrackingData = async (gr: string) => {
    if (!CLIENT_ID) {
      setError('Client ID is not configured');
      return null;
    }

    try {
      const res = await fetch(
        `${API_URL}/api/greentrans/tracking?clientId=${CLIENT_ID}&grNo=${encodeURIComponent(gr.trim())}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await res.json();

      if (result.status !== '1') {
        throw new Error(result.message || 'Tracking failed');
      }

      return result;
    } catch (err: any) {
      console.error(err);
      return null;
    }
  };

  const handleFetch = async () => {
    if (!grNo.trim()) {
      setError('Please enter GR Number');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setSelectedGr(null);          // clear selection when manual search
    setTrackedDetailData(null);

    const result = await fetchTrackingData(grNo);

    if (result) {
      setData(result);
    } else {
      setError('Failed to fetch tracking data');
    }

    setLoading(false);
  };

  const handleSelectTracked = async (gr: string) => {
    if (selectedGr === gr) {
      setSelectedGr(null);
      setTrackedDetailData(null);
      return;
    }

    setSelectedGr(gr);
    setTrackedDetailLoading(true);
    setTrackedDetailError(null);
    setTrackedDetailData(null);
    setData(null);                // clear manual search result

    const result = await fetchTrackingData(gr);

    if (result) {
      setTrackedDetailData(result);
    } else {
      setTrackedDetailError('Failed to load current status for this GR');
    }

    setTrackedDetailLoading(false);
  };

  const handleAddToSystem = async () => {
    if (!data?.consignmentdetail?.grno) return;

    const currentGr = data.consignmentdetail.grno.trim();

    if (trackedConsignments.some((c) => c.GRNo === currentGr)) {
      alert('This GR is already in your tracking list.');
      return;
    }

    try {
      const saveRes = await fetch(`${API_URL}/api/consignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GRNo: currentGr,
          bookingData: {}, // extend later if needed
          trackingData: data,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || 'Failed to save');
      }

      alert('Added to tracking system!');
      await loadTrackedConsignments();
    } catch (err: any) {
      setError(err.message || 'Failed to add to tracking system');
    }
  };

  useEffect(() => {
    loadTrackedConsignments();
  }, []);

  const displayData = data || trackedDetailData;
  const isTrackedView = !!trackedDetailData;

  const d = displayData?.consignmentdetail;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Truck className="text-blue-600" />
        Consignment Tracking
      </h2>

      <div className="space-y-8">
        {/* Search + Result */}
        <div className="bg-white rounded-xl shadow p-6">
          {/* Search bar */}
          <div className="flex gap-3 mb-6">
            <input
              placeholder="Enter GR No / Consignment Number"
              value={grNo}
              onChange={(e) => setGrNo(e.target.value.toUpperCase())}
              className="flex-1 border px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              disabled={loading}
            />
            <button
              onClick={handleFetch}
              disabled={loading || !grNo.trim()}
              className="px-6 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
            >
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              {loading ? 'Fetching…' : 'Track'}
            </button>
          </div>

          {(error || trackedDetailError) && (
            <p className="text-red-600 font-medium mb-4">
              {error || trackedDetailError}
            </p>
          )}

          {displayData && (
            <div className="space-y-8">
              {/* Consignment Details */}
              <div>
                <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <Package className="text-green-600" />
                  Consignment Details {isTrackedView && `(GR ${selectedGr})`}
                </h3>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 text-sm">
                  <p><strong>GR No:</strong> <Val v={d.grno} /></p>
                  <p><strong>GR Date:</strong> <Val v={d.grdt} /></p>
                  <p><strong>GR Type:</strong> <Val v={d.grtype} /></p>
                  <p><strong>Origin:</strong> <Val v={d.origin} /></p>
                  <p><strong>Destination:</strong> <Val v={d.destname} /></p>
                  <p><strong>Consignor:</strong> <Val v={d.cngr} /></p>
                  <p><strong>Consignee:</strong> <Val v={d.cnge} /></p>
                  <p><strong>Packages:</strong> <Val v={d.pckgs} /></p>
                  <p><strong>Actual Weight:</strong> <Val v={d.aweight} /></p>
                  <p><strong>Charged Weight:</strong> <Val v={d.cweight} /></p>
                  <p><strong>Goods:</strong> <Val v={d.goods} /></p>
                  <p><strong>Packing:</strong> <Val v={d.packing} /></p>
                  <p><strong>E-Way Bill:</strong> <Val v={d.ewaybillno} /></p>
                  <p><strong>Invoice No:</strong> <Val v={d.invoiceno} /></p>
                  <p><strong>Invoice Date:</strong> <Val v={d.invoicedt} /></p>
                  <p><strong>Invoice Value:</strong> <Val v={d.invoicevalue} /></p>
                  <p><strong>Delivered:</strong> <Val v={d.delivered} /></p>
                  <p><strong>Expected Delivery:</strong> <Val v={d.expecteddeliverydt} /></p>
                </div>
              </div>

              {/* Timeline */}
              <div>
                <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <Calendar className="text-purple-600" />
                  Activity Timeline
                </h3>

                {displayData.consignmentactivitylist?.length > 0 ? (
                  <div className="space-y-6 max-h-96 overflow-y-auto pr-2">
                    {displayData.consignmentactivitylist.map((a: any, i: number) => (
                      <div
                        key={i}
                        className="border-l-4 border-blue-500 pl-5 relative pb-2"
                      >
                        <div className="absolute -left-2 top-1.5 w-4 h-4 bg-blue-500 rounded-full border-4 border-white" />
                        <p className="font-medium text-gray-900">{a.activity}</p>
                        <p className="text-sm text-gray-600">{a.date}</p>
                        <p className="text-sm mt-1">{a.details}</p>
                        {a.documentno && (
                          <p className="text-xs text-gray-500 mt-1">
                            Document: {a.documentno}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No activity recorded yet.</p>
                )}
              </div>

              {/* Only show "Add" button for newly searched (not already tracked) */}
              {!isTrackedView && (
                <button
                  onClick={handleAddToSystem}
                  disabled={loading || !data}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  Add to My Tracking List
                </button>
              )}
            </div>
          )}

          {!displayData && !loading && !error && !trackedDetailError && (
            <div className="text-center py-12 text-gray-500">
              Enter a GR number above to track a consignment
            </div>
          )}
        </div>

        {/* My Tracked GRs – now below */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-3">
            <Truck className="w-6 h-6 text-green-600" />
            My Tracked GRs
          </h3>

          {loadingTracked ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin mr-2" />
              <span className="text-gray-600">Loading tracked consignments...</span>
            </div>
          ) : trackedConsignments.length === 0 ? (
            <p className="text-gray-500 italic text-center py-8">
              No consignments tracked yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[500px]">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="p-3 text-left font-medium">GR No</th>
                    <th className="p-3 text-left font-medium">Status</th>
                    <th className="p-3 text-left font-medium hidden md:table-cell">Last Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {trackedConsignments.map((c) => (
                    <tr
                      key={c.GRNo}
                      onClick={() => handleSelectTracked(c.GRNo)}
                      className={`border-t hover:bg-gray-50 cursor-pointer transition-colors ${
                        selectedGr === c.GRNo ? 'bg-blue-50' : ''
                      }`}
                    >
                      <td className="p-3 font-mono font-medium">{c.GRNo}</td>
                      <td className="p-3">
                        <span
                          className={`inline-block px-2.5 py-1 rounded text-xs font-medium ${
                            c.currentStatus === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : c.currentStatus?.toLowerCase().includes('delay') ||
                                c.currentStatus === 'In Transit'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {c.currentStatus || 'Tracking'}
                        </span>
                      </td>
                      <td className="p-3 text-gray-600 text-xs hidden md:table-cell">
                        {c.updated_at
                          ? new Date(c.updated_at).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}