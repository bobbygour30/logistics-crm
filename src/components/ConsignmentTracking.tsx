// src/components/ConsignmentTracking.tsx
import { useState } from 'react';
import { Search, Truck, Calendar, Package } from 'lucide-react';

/* ---------- helpers ---------- */
const Val = ({ v }: { v: any }) => (
  <span className="text-gray-800">{v ?? '—'}</span>
);

/* ---------- component ---------- */
export function ConsignmentTracking() {
  const [clientId, setClientId] = useState('');
  const [grNo, setGrNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [trackedGRs, setTrackedGRs] = useState<string[]>([]);  // New state for tracked GRs

  const handleFetch = async () => {
    if (!clientId || !grNo) {
      setError('Client ID and GR No are required');
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `http://localhost:3000/api/greentrans/tracking?clientId=${clientId}&grNo=${grNo}`,
        { method: 'GET', headers: { 'Content-Type': 'application/json' } }
      );

      const result = await res.json();

      if (result.status !== '1') {
        throw new Error(result.message || 'Tracking failed');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || 'Fetch failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToSystem = async () => {
    if (!data) return;

    try {
      const saveRes = await fetch('http://localhost:3000/api/consignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GRNo: grNo,
          bookingData: {}, // Fetch if needed
          trackingData: data,
        }),
      });

      if (!saveRes.ok) throw new Error('Failed to add');

      alert('Added to tracking system!');
      setTrackedGRs(prev => [...prev, grNo]);  // Add to local list
    } catch (err: any) {
      setError(err.message);
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

      {/* Inputs */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <input
          placeholder="Client ID"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          className="border px-4 py-2 rounded"
        />
        <input
          placeholder="GR No"
          value={grNo}
          onChange={(e) => setGrNo(e.target.value)}
          className="border px-4 py-2 rounded"
        />
      </div>

      <button
        onClick={handleFetch}
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded flex justify-center gap-2"
      >
        <Search size={18} />
        {loading ? 'Fetching…' : 'Track'}
      </button>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {/* DATA */}
      {data && (
        <div className="mt-6 space-y-6">
          {/* Consignment Details */}
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Package className="text-green-600" />
              Consignment Details
            </h3>

            <div className="grid md:grid-cols-2 gap-2 text-sm">
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
          <div className="bg-gray-50 p-4 rounded">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="text-purple-600" />
              Activity Timeline
            </h3>

            <div className="space-y-4">
              {data.consignmentactivitylist.map((a: any, i: number) => (
                <div key={i} className="border-l-2 border-blue-500 pl-4 relative">
                  <div className="absolute -left-2 top-1 w-3 h-3 bg-blue-500 rounded-full" />
                  <p className="font-medium">{a.activity}</p>
                  <p className="text-sm text-gray-600">{a.date}</p>
                  <p className="text-sm">{a.details}</p>
                  <p className="text-xs text-gray-500">
                    Document: {a.documentno ?? '—'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Add to System Button */}
          <button
            onClick={handleAddToSystem}
            className="w-full bg-green-600 text-white py-2 rounded mt-4"
          >
            Add to Tracking System
          </button>
        </div>
      )}

      {/* Tracked GR List */}
      {trackedGRs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Tracked GRs</h3>
          <ul className="space-y-2">
            {trackedGRs.map((gr) => (
              <li key={gr} className="bg-white p-3 rounded shadow">
                {gr} - Tracking started
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}