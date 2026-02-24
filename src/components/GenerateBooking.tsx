import { useState, useEffect, useCallback } from 'react';
import { Package, Search, Truck, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

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
const CLIENT_ID = import.meta.env.VITE_GREENTRANS_CLIENT_ID;
const ITEMS_PER_PAGE = 10;

/* -------------------- Component -------------------- */

export function GenerateBooking() {
  const [grNo, setGrNo] = useState('');
  const [fetching, setFetching] = useState(false);
  const [tracking, setTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BookingFormData | null>(null);

  const [trackedConsignments, setTrackedConsignments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loadingTracked, setLoadingTracked] = useState(true);

  const [selectedGr, setSelectedGr] = useState<string | null>(null);
  const [trackedDetailLoading, setTrackedDetailLoading] = useState(false);
  const [trackedDetailData, setTrackedDetailData] = useState<BookingFormData | null>(null);
  const [trackedDetailError, setTrackedDetailError] = useState<string | null>(null);

  const loadTrackedConsignments = useCallback(async () => {
    try {
      setLoadingTracked(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
      });
      
      const res = await fetch(`${API_URL}/api/consignments?${params}`);
      if (!res.ok) throw new Error('Failed to load tracked consignments');
      const json = await res.json();
      setTrackedConsignments(json.consignments || []);
      setTotalCount(json.total || 0);
    } catch (err) {
      console.error('Error loading tracked consignments:', err);
      setError('Could not load tracked consignments');
    } finally {
      setLoadingTracked(false);
    }
  }, [currentPage]);

  useEffect(() => {
    loadTrackedConsignments();
  }, [loadTrackedConsignments]);

  const syncToDatabase = async (gr: string, bookingData: any, trackingData: any) => {
    try {
      const saveRes = await fetch(`${API_URL}/api/consignments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          GRNo: gr.trim(),
          bookingData,
          trackingData,
        }),
      });

      if (saveRes.ok) {
        console.log(`[DB SYNC] Success for GR ${gr} from booking view`);
        await loadTrackedConsignments();
      } else {
        const errText = await saveRes.text();
        console.warn(`[DB SYNC] Failed for GR ${gr}: ${errText}`);
      }
    } catch (err) {
      console.error(`[DB SYNC ERROR] GR ${gr}:`, err);
    }
  };

  const fetchBookingDetail = async (gr: string, isTracked = false) => {
    setFetching(true);
    setError(null);
    if (!isTracked) {
      setData(null);
      setSelectedGr(null);
      setTrackedDetailData(null);
    }

    try {
      const res = await fetch(
        `${API_URL}/api/greentrans/booking?grno=${encodeURIComponent(gr.trim())}`
      );

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const result = await res.json();

      if (result.CommandStatus !== '1') {
        throw new Error(result.CommandMessage || 'Fetch failed');
      }

      // Fetch fresh tracking and sync both to DB
      const trackingRes = await fetch(
        `${API_URL}/api/greentrans/tracking?clientId=${encodeURIComponent(CLIENT_ID || '')}&grNo=${encodeURIComponent(gr.trim())}`
      );
      let trackingData = {};
      if (trackingRes.ok) {
        trackingData = await trackingRes.json();
      }

      await syncToDatabase(gr, result, trackingData);

      if (isTracked) {
        setTrackedDetailData(result);
      } else {
        setData(result);
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to fetch booking details';
      if (isTracked) {
        setTrackedDetailError(msg);
      } else {
        setError(msg);
      }
    } finally {
      setFetching(false);
    }
  };

  const handleFetch = () => {
    if (!grNo.trim()) {
      setError('GR No is required');
      return;
    }
    fetchBookingDetail(grNo);
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
    setData(null);

    await fetchBookingDetail(gr, true);
    setTrackedDetailLoading(false);
  };

  const handleStartTracking = async () => {
    if (!data?.GRNo) return;

    const currentGr = data.GRNo.trim();

    if (trackedConsignments.some((c) => c.GRNo === currentGr)) {
      alert('This GR is already being tracked.');
      return;
    }

    setTracking(true);
    setError(null);

    try {
      const trackingRes = await fetch(
        `${API_URL}/api/greentrans/tracking?clientId=${encodeURIComponent(
          CLIENT_ID || ''
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
      await loadTrackedConsignments();
    } catch (err: any) {
      setError(err.message || 'Failed to start tracking');
    } finally {
      setTracking(false);
    }
  };

  const displayData = data || trackedDetailData;
  const isTrackedView = !!trackedDetailData;

  // Pagination handlers
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
  
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold">Greentrans Booking Details</h1>
      </div>

      <div className="space-y-8">
        {/* Search Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex gap-3 mb-6">
            <input
              placeholder="Enter GR No"
              value={grNo}
              onChange={(e) => setGrNo(e.target.value.toUpperCase())}
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => e.key === 'Enter' && handleFetch()}
              disabled={fetching}
            />
            <button
              onClick={handleFetch}
              disabled={fetching || !grNo.trim()}
              className={`px-6 py-2 bg-blue-600 text-white rounded flex items-center gap-2 hover:bg-blue-700 disabled:opacity-50 min-w-[140px] justify-center ${
                fetching ? 'cursor-wait' : ''
              }`}
            >
              {fetching ? <Loader2 className="animate-spin" size={18} /> : <Search size={18} />}
              {fetching ? 'Fetching…' : 'Fetch'}
            </button>
          </div>

          {(error || trackedDetailError) && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded border border-red-200">
              {error || trackedDetailError}
            </div>
          )}

          {displayData && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <Info label="GR No" value={displayData.GRNo} />
                <Info label="GR Date" value={displayData.GRDate} />
                <Info label="GR Time" value={displayData.GRTime} />
                <Info label="Mode Type" value={displayData.ModeType} />
                <Info label="Load Type" value={displayData.LoadType} />
                <Info label="Booking Mode" value={displayData.BookingMode} />
                <Info label="Total Packages" value={displayData.TotalPcks} />
                <Info label="Gross Weight (kg)" value={displayData.GrossWeight} />
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">🚚 Shipper {isTrackedView && `(GR ${selectedGr})`}</h3>
                  <Detail label="Name" value={displayData.ShipperDetails?.Name} />
                  <Detail label="City" value={displayData.ShipperDetails?.City} />
                  <Detail label="State" value={displayData.ShipperDetails?.State} />
                  <Detail label="Mobile" value={displayData.ShipperDetails?.Mobile} />
                  <Detail label="GST No" value={displayData.ShipperDetails?.GSTNo} />
                </div>

                <div className="bg-white rounded-xl shadow p-6">
                  <h3 className="text-lg font-semibold mb-4">📦 Consignee</h3>
                  <Detail label="Name" value={displayData.ConsigneeDetails?.Name} />
                  <Detail label="City" value={displayData.ConsigneeDetails?.City} />
                  <Detail label="State" value={displayData.ConsigneeDetails?.State} />
                  <Detail label="Mobile" value={displayData.ConsigneeDetails?.Mobile} />
                  <Detail label="GST No" value={displayData.ConsigneeDetails?.GSTNo} />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4">🧾 Invoice Details</h3>
                {displayData.InvoiceDetails.length === 0 ? (
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
                        {displayData.InvoiceDetails.map((inv, i) => (
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

              {!isTrackedView && (
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
              )}
            </>
          )}

          {!displayData && !fetching && !error && !trackedDetailError && (
            <div className="text-center py-12 text-gray-500">
              Enter a GR number above to view booking details
            </div>
          )}
        </div>

        {/* Tracked GRs Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-xl font-bold mb-5 flex items-center gap-3">
            <Truck className="w-6 h-6 text-green-600" />
            Tracked GRs ({totalCount})
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
            <>
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
                          {c.updatedAt
                            ? new Date(c.updatedAt).toLocaleString('en-IN', {
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-medium">Page {currentPage} of {totalPages}</span>
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}