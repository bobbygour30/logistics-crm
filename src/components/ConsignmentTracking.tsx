import { useState } from 'react';
import { Search, Truck, Calendar } from 'lucide-react';

export function ConsignmentTracking() {
  const [clientId, setClientId] = useState('');
  const [grNo, setGrNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`https://greentrans.in:444/api/Tracking/GRTracking?ClientId=${clientId}&GRNo=${grNo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const result = await response.json();
      if (result.status !== '1') {
        throw new Error(result.message || 'API error');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Truck className="w-6 h-6 text-blue-600" />
        Consignment Tracking
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client ID *</label>
          <input
            type="text"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="Your Client ID"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">GR No *</label>
          <input
            type="text"
            value={grNo}
            onChange={(e) => setGrNo(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., 149358"
            required
          />
        </div>
      </div>

      <button
        onClick={handleFetch}
        disabled={loading || !clientId || !grNo}
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Search className="w-4 h-4" />
        {loading ? 'Fetching...' : 'Track Consignment'}
      </button>

      {error && <p className="mt-4 text-red-600">{error}</p>}

      {data && (
        <div className="mt-6 space-y-6">
          {/* Consignment Details */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Consignment Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>GR No:</strong> {data.consignmentdetail.grno}</p>
              <p><strong>GR Date:</strong> {data.consignmentdetail.grdt}</p>
              <p><strong>GR Type:</strong> {data.consignmentdetail.grtype}</p>
              <p><strong>Customer Name:</strong> {data.consignmentdetail.custname}</p>
              <p><strong>Origin:</strong> {data.consignmentdetail.origin}</p>
              <p><strong>Destination:</strong> {data.consignmentdetail.destname}</p>
              <p><strong>Consignor:</strong> {data.consignmentdetail.cngr}</p>
              <p><strong>Consignee:</strong> {data.consignmentdetail.cnge}</p>
              <p><strong>Packages:</strong> {data.consignmentdetail.pckgs}</p>
              <p><strong>Charged Weight:</strong> {data.consignmentdetail.cweight}</p>
              <p><strong>Goods:</strong> {data.consignmentdetail.goods}</p>
              <p><strong>Packing:</strong> {data.consignmentdetail.packing}</p>
              <p><strong>E-Way Bill No:</strong> {data.consignmentdetail.ewaybillno || 'N/A'}</p>
              <p><strong>Invoice No:</strong> {data.consignmentdetail.invoiceno || 'N/A'}</p>
            </div>
          </div>

          {/* Activity List - Timeline */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-600" />
              Activity Timeline
            </h3>
            <div className="space-y-4">
              {data.consignmentactivitylist.map((activity: any, index: number) => (
                <div key={index} className="relative pl-8 pb-4 border-l-2 border-green-500">
                  <div className="absolute left-[-7px] top-1 w-3 h-3 bg-green-500 rounded-full"></div>
                  <p className="font-medium">{activity.activity}</p>
                  <p className="text-sm text-gray-600">{activity.date}</p>
                  <p className="text-sm">{activity.details}</p>
                  <p className="text-xs text-gray-500">From: {activity.fromstation} to {activity.tostation}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}