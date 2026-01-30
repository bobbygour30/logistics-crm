// src/components/ConsignmentDashboard.tsx
import { useState, useEffect } from 'react';
import { Truck, AlertTriangle, CheckCircle } from 'lucide-react';

export default function ConsignmentDashboard() {
  const [consignments, setConsignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConsignments = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('http://localhost:3000/api/consignments');
      if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
      const data = await res.json();
      setConsignments(data.consignments || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load consignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsignments();
    const interval = setInterval(fetchConsignments, 30000); // every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Consignment Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {consignments.map((c: any) => {
          const delayed = (Date.now() - new Date(c.lastTimestamp).getTime()) > 24 * 60 * 60 * 1000;
          return (
            <div key={c.GRNo} className="bg-white rounded-xl shadow p-5 border">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">GR No</p>
                  <p className="font-mono font-bold text-lg">{c.GRNo}</p>
                </div>
                {delayed ? (
                  <AlertTriangle className="text-red-500 w-8 h-8" />
                ) : c.delivered ? (
                  <CheckCircle className="text-green-500 w-8 h-8" />
                ) : (
                  <Truck className="text-blue-500 w-8 h-8" />
                )}
              </div>
              <p className="mt-3"><strong>Status:</strong> {c.currentStatus}</p>
              <p><strong>Last Update:</strong> {new Date(c.lastTimestamp).toLocaleString()}</p>
              {c.expectedDelivery && <p><strong>Expected:</strong> {c.expectedDelivery}</p>}
              <p><strong>Origin:</strong> {c.origin || '—'}</p>
              <p><strong>Destination:</strong> {c.destination || '—'}</p>
              <p><strong>Consignee:</strong> {c.consigneeName || '—'} ({c.consigneeCity || '—'})</p>
              {delayed && <p className="text-red-600 font-medium mt-2">DELAYED</p>}
            </div>
          );
        })}
      </div>
      {consignments.length === 0 && <p className="text-gray-500 mt-10">No consignments being tracked yet.</p>}
    </div>
  );
}