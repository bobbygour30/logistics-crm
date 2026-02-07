// src/components/GenerateBooking.tsx
import { useState, useEffect } from 'react';
import { Package, Search, Truck } from 'lucide-react';

/* -------------------- Helpers -------------------- */

const show = (value: any) =>
  value === null || value === undefined || value === ''
    ? '—'
    : String(value).trim();

/* -------------------- Types -------------------- */

interface PackageDetail {
  PartNo: string;
  HSNCode: string;
  Article: string;
  PackingType: string;
  NoOfPckgs: number;
  GrossWeight: number;
  Length: number;
  Width: number;
  Height: number;
  DimensionType: string;
  VoluMetricWeight: number;
}

interface InvoiceDetail {
  InvoiceNo: string;
  InvoiceDate: string;
  InvoiceValue: number;
  EwaybillNo?: string;
  EwayBillNo?: string;
  EwayBillDate?: string;
  EwayBillValidUpto?: string;
  PackgesDetail: PackageDetail[];
}

interface AddressDetails {
  Code: string;
  Name: string;
  Address: string | null;
  City: string | null;
  State: string | null;
  ZipCode: string | null;
  Mobile: string | null;
  Email: string | null;
  GSTNo: string | null;
}

interface BookingFormData {
  GRNo: string;
  GRDate: string;
  GRTime: string;
  ModeType: string;
  LoadType: string;
  BookingMode: string;
  TotalPcks: number;
  GrossWeight: number;
  ShipperDetails: AddressDetails;
  ConsigneeDetails: AddressDetails;
  InvoiceDetails: InvoiceDetail[];
}

/* -------------------- Small UI Components -------------------- */

function Info({ label, value }: { label: string; value: any }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold">{show(value)}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: any }) {
  return (
    <div className="flex justify-between py-2 border-b text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium">{show(value)}</span>
    </div>
  );
}

const API_URL = import.meta.env.VITE_API_URL;

/* -------------------- Component -------------------- */

export function GenerateBooking() {
  const [grNo, setGrNo] = useState('');
  const [fetching, setFetching] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BookingFormData | null>(null);

  // Tracked consignments from backend
  const [trackedConsignments, setTrackedConsignments] = useState<any[]>([]);
  const [loadingTracked, setLoadingTracked] = useState(true);

  const loadTrackedConsignments = async () => {
    try {
      setLoadingTracked(true);
      const res = await fetch(`${API_URL}/api/consignments`);
      if (!res.ok) throw new Error('Failed to load tracked consignments');
      const json = await res.json();
      // Support both { consignments: [...] } and direct array
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

  const fetchBookingDetail = async () => {
    if (!grNo.trim()) {
      setError('GR No is required');
      return;
    }

    setFetching(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch(
        `${API_URL}/api/greentrans/booking?grno=${encodeURIComponent(grNo.trim())}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();

      if (result.CommandStatus !== '1') {
        throw new Error(result.CommandMessage || 'Fetch failed');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch booking details');
    } finally {
      setFetching(false);
    }
  };

  const handleStartTracking = async () => {
    if (!data?.GRNo) return;

    const currentGr = data.GRNo.trim();

    // Quick client-side duplicate check
    if (trackedConsignments.some((c) => c.GRNo === currentGr)) {
      alert('This GR is already being tracked.');
      return;
    }

    setTracking(true);
    setError(null);

    try {
      const trackingRes = await fetch(
        `${API_URL}/api/greentrans/tracking?clientId=${encodeURIComponent(
          import.meta.env.VITE_GREENTRANS_CLIENT_ID || 'YOUR_CLIENT_ID_HERE'
        )}&grNo=${encodeURIComponent(currentGr)}`
      );

      if (!trackingRes.ok) throw new Error('Failed to fetch tracking data');

      const trackingData = await trackingRes.json();

      const saveRes = await fetch(`${API_URL}/api/consignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GRNo: currentGr,
          bookingData: data,
          trackingData,
        }),
      });

      if (!saveRes.ok) {
        const err = await saveRes.json();
        throw new Error(err.error || 'Failed to save consignment');
      }

      alert('Consignment added to tracking system! Delay checks are now active.');
      // Refresh list from backend
      await loadTrackedConsignments();
    } catch (err: any) {
      setError(err.message || 'Failed to start tracking');
    } finally {
      setTracking(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold">Greentrans Booking Details</h1>
      </div>

      {/* Search */}
      <div className="flex gap-3 mb-6">
        <input
          placeholder="Enter GR No"
          value={grNo}
          onChange={(e) => setGrNo(e.target.value.toUpperCase())}
          className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchBookingDetail}
          disabled={fetching}
          className={`px-6 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 min-w-[140px] ${
            fetching ? 'cursor-wait' : ''
          }`}
        >
          <Search className="w-4 h-4" />
          {fetching ? 'Fetching…' : 'Fetch'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded border border-red-200">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {data && (
            <>
              {/* Booking Summary */}
              <div className="bg-white rounded-xl shadow p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                <Info label="GR No" value={data.GRNo} />
                <Info label="GR Date" value={data.GRDate} />
                <Info label="GR Time" value={data.GRTime} />
                <Info label="Mode Type" value={data.ModeType} />
                <Info label="Load Type" value={data.LoadType} />
                <Info label="Booking Mode" value={data.BookingMode} />
                <Info label="Total Packages" value={data.TotalPcks} />
                <Info label="Gross Weight (kg)" value={data.GrossWeight} />
              </div>

              {/* Addresses */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">🚚 Shipper</h3>
                  <Detail label="Name" value={data.ShipperDetails?.Name} />
                  <Detail label="City" value={data.ShipperDetails?.City} />
                  <Detail label="State" value={data.ShipperDetails?.State} />
                  <Detail label="Mobile" value={data.ShipperDetails?.Mobile} />
                  <Detail label="GST No" value={data.ShipperDetails?.GSTNo} />
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">📦 Consignee</h3>
                  <Detail label="Name" value={data.ConsigneeDetails?.Name} />
                  <Detail label="City" value={data.ConsigneeDetails?.City} />
                  <Detail label="State" value={data.ConsigneeDetails?.State} />
                  <Detail label="Mobile" value={data.ConsigneeDetails?.Mobile} />
                  <Detail label="GST No" value={data.ConsigneeDetails?.GSTNo} />
                </div>
              </div>

              {/* Invoice Table */}
              <div className="bg-white rounded-xl shadow p-6">
                <h3 className="text-lg font-semibold mb-4">🧾 Invoice Details</h3>
                {data.InvoiceDetails.length === 0 ? (
                  <p className="text-gray-500">No invoice details available</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="border p-3 text-left">Invoice No</th>
                          <th className="border p-3 text-left">Date</th>
                          <th className="border p-3 text-right">Value</th>
                          <th className="border p-3 text-left">E-Way Bill</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.InvoiceDetails.map((inv, i) => (
                          <tr key={i} className="hover:bg-gray-50">
                            <td className="border p-3">{show(inv.InvoiceNo)}</td>
                            <td className="border p-3">{show(inv.InvoiceDate)}</td>
                            <td className="border p-3 text-right">
                              {inv.InvoiceValue.toLocaleString()}
                            </td>
                            <td className="border p-3">
                              {show(inv.EwaybillNo || inv.EwayBillNo)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Start Tracking Button */}
              <div className="flex justify-center pt-4">
                <button
                  onClick={handleStartTracking}
                  disabled={tracking || !data?.GRNo}
                  className={`px-10 py-3 bg-green-600 text-white font-medium rounded-lg shadow hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2 ${
                    tracking ? 'cursor-wait' : ''
                  }`}
                >
                  <Truck className="w-5 h-5" />
                  {tracking ? 'Adding...' : 'Start Tracking This GR'}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Tracked GRs – always visible */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-5 sticky top-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-green-600" />
              Tracked GRs
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