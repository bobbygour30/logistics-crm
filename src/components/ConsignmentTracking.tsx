// src/components/ConsignmentTracking.tsx
import { useState, useEffect } from 'react';
import { Search, Truck, Calendar, Package } from 'lucide-react';

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

  useEffect(() => {
    loadTrackedConsignments();
  }, []);

  const handleFetch = async () => {
    if (!CLIENT_ID) {
      setError('Client ID is not configured in environment variables');
      return;
    }

    if (!grNo.trim()) {
      setError('Please enter GR Number');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `${API_URL}/api/greentrans/tracking?clientId=${CLIENT_ID}&grNo=${encodeURIComponent(grNo.trim())}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      const result = await res.json();

      if (result.status !== '1') {
        throw new Error(result.message || 'Tracking failed');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tracking data');
    } finally {
      setLoading(false);
    }
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
          bookingData: {}, // you can improve this later if needed
          trackingData: data,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || 'Failed to save');
      }

      alert('Added to tracking system!');
      // Refresh list from backend
      await loadTrackedConsignments();
    } catch (err: any) {
      setError(err.message || 'Failed to add to tracking system');
    }
  };

  const d = data?.consignmentdetail;

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <Truck className="text-blue-600" />
        Consignment Tracking
      </h2>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Search */}
          <div className="flex gap-3">
            <input
              placeholder="Enter GR No / Consignment Number"
              value={grNo}
              onChange={(e) => setGrNo(e.target.value.toUpperCase())}
              className="flex-1 border px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
            />
            <button
              onClick={handleFetch}
              disabled={loading || !grNo.trim()}
              className="px-6 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px]"
            >
              <Search size={18} />
              {loading ? 'Fetching…' : 'Track'}
            </button>
          </div>

          {error && <p className="text-red-600 font-medium">{error}</p>}

          {data && (
            <div className="space-y-8">
              {/* Consignment Details */}
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <Package className="text-green-600" />
                  Consignment Details
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
              <div className="bg-white p-6 rounded-xl shadow">
                <h3 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <Calendar className="text-purple-600" />
                  Activity Timeline
                </h3>

                {data.consignmentactivitylist?.length > 0 ? (
                  <div className="space-y-6">
                    {data.consignmentactivitylist.map((a: any, i: number) => (
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

              <button
                onClick={handleAddToSystem}
                disabled={!data}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add to My Tracking List
              </button>
            </div>
          )}
        </div>

        {/* Tracked GRs – always visible */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-5 sticky top-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              My Tracked GRs
            </h3>

            {loadingTracked ? (
              <p className="text-gray-500 text-sm">Loading tracked consignments...</p>
            ) : trackedConsignments.length === 0 ? (
              <p className="text-gray-500 text-sm italic">No consignments tracked yet</p>
            ) : (
              <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600 sticky top-0">
                    <tr>
                      <th className="p-2 text-left font-medium">GR No</th>
                      <th className="p-2 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trackedConsignments.map((c) => (
                      <tr key={c.GRNo} className="border-t hover:bg-gray-50">
                        <td className="p-2 font-mono">{c.GRNo}</td>
                        <td className="p-2">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}