// src/components/ConsignmentTracking.tsx
import { useState } from 'react';
import { Search, Truck, Calendar, Package } from 'lucide-react';

/* ---------- helpers ---------- */
const Val = ({ v }: { v: any }) => (
  <span className="text-gray-800">{v ?? '—'}</span>
);

const API_URL = import.meta.env.VITE_API_URL;
const CLIENT_ID = import.meta.env.VITE_GREENTRANS_CLIENT_ID; // renamed for clarity

/* ---------- component ---------- */
export function ConsignmentTracking() {
  const [grNo, setGrNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [trackedGRs, setTrackedGRs] = useState<string[]>([]);

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
        `${API_URL}/api/greentrans/tracking?clientId=${CLIENT_ID}&grNo=${grNo}`,
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
    if (!data) return;

    try {
      const saveRes = await fetch(`${API_URL}/api/consignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GRNo: grNo,
          bookingData: {}, // ← you might want to fetch or remove this later
          trackingData: data,
        }),
      });

      if (!saveRes.ok) throw new Error('Failed to save consignment');

      alert('Added to tracking system!');
      setTrackedGRs((prev) => [...prev, grNo]);
      // Optional: setGrNo(''); // clear input after success
    } catch (err: any) {
      setError(err.message || 'Failed to add to system');
    }
  };

  const d = data?.consignmentdetail;

  return (
    <div className="max-w-5xl mx-auto bg-white p-6 rounded-xl shadow">
      {/* Header */}
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Truck className="text-blue-600" />
        Consignment Tracking
      </h2>

      {/* Inputs – only GR No now */}
      <div className="mb-4">
        <input
          placeholder="Enter GR No / Consignment Number"
          value={grNo}
          onChange={(e) => setGrNo(e.target.value)}
          className="w-full border px-4 py-2.5 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
        />
      </div>

      <button
        onClick={handleFetch}
        disabled={loading || !grNo.trim()}
        className="w-full bg-blue-600 text-white py-2.5 rounded flex justify-center items-center gap-2 disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        <Search size={18} />
        {loading ? 'Fetching…' : 'Track Consignment'}
      </button>

      {error && <p className="mt-4 text-red-600 font-medium">{error}</p>}

      {/* DATA */}
      {data && (
        <div className="mt-8 space-y-8">
          {/* Consignment Details */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="text-green-600" />
              Consignment Details
            </h3>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm">
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
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-100">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Calendar className="text-purple-600" />
              Activity Timeline
            </h3>

            <div className="space-y-5">
              {data.consignmentactivitylist?.length > 0 ? (
                data.consignmentactivitylist.map((a: any, i: number) => (
                  <div key={i} className="border-l-4 border-blue-500 pl-4 relative">
                    <div className="absolute -left-2 top-1.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white" />
                    <p className="font-medium text-gray-900">{a.activity}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{a.date}</p>
                    <p className="text-sm mt-1">{a.details}</p>
                    {a.documentno && (
                      <p className="text-xs text-gray-500 mt-1">
                        Document: {a.documentno}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-gray-500">No activity recorded yet.</p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAddToSystem}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Add to My Tracking List
          </button>
        </div>
      )}

      {/* Tracked GR List */}
      {trackedGRs.length > 0 && (
        <div className="mt-10">
          <h3 className="text-xl font-bold mb-4">Recently Tracked Consignments</h3>
          <ul className="space-y-2">
            {trackedGRs.map((gr) => (
              <li
                key={gr}
                className="bg-gray-50 p-3 rounded border border-gray-200 text-gray-800"
              >
                {gr}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}