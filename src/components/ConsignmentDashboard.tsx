// src/components/ConsignmentDashboard.tsx (updated - removed notifications)
import { useState, useEffect } from 'react';
import { Truck, AlertTriangle, CheckCircle } from 'lucide-react';

// Define minimal types for what we expect from the API
interface Consignment {
  _id: string;
  GRNo: string;
  currentStatus: string;
  lastTimestamp: string;
  delivered: boolean;
  expectedDelivery?: string | null;
  origin?: string | null;
  destination?: string | null;
  location?: string | null;
  // Add more fields if needed
}

const API_URL = import.meta.env.VITE_API_URL;

export default function ConsignmentDashboard() {
  const [consignments, setConsignments] = useState<Consignment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch consignments
      const consRes = await fetch(`${API_URL}/api/consignments`);
      if (!consRes.ok) {
        throw new Error(`Failed to fetch consignments: ${consRes.status}`);
      }
      const consData = await consRes.json();
      setConsignments(consData.consignments || []);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const interval = setInterval(fetchData, 30000); // every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="p-6 text-center text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 text-red-600 text-center">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <h1 className="text-3xl font-bold flex items-center gap-3">
        Dashboard
      </h1>

      {/* Consignments Section */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Tracked Consignments</h2>

        {consignments.length === 0 ? (
          <p className="text-gray-500">No consignments being tracked yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {consignments.map((c) => {
              const delayed =
                (Date.now() - new Date(c.lastTimestamp).getTime()) >
                24 * 60 * 60 * 1000;

              return (
                <div
                  key={c.GRNo}
                  className="bg-white rounded-xl shadow p-5 border border-gray-200"
                >
                  <div className="flex justify-between items-start mb-3">
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

                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Status:</strong> {c.currentStatus}
                    </p>
                    <p>
                      <strong>Last Update:</strong>{' '}
                      {new Date(c.lastTimestamp).toLocaleString()}
                    </p>
                    {c.expectedDelivery && (
                      <p>
                        <strong>Expected:</strong> {c.expectedDelivery}
                      </p>
                    )}
                    <p>
                      <strong>Origin:</strong> {c.origin || '—'}
                    </p>
                    <p>
                      <strong>Destination:</strong> {c.destination || '—'}
                    </p>
                    {delayed && (
                      <p className="text-red-600 font-medium mt-2">DELAYED</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}