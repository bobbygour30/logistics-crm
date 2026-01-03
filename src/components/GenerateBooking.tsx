import { useState } from 'react';
import { Plus, Minus, Save, Package } from 'lucide-react';

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
  EwayBillNo: string;
  EwayBillDate: string;
  EwayBillValidUpto: string;
  PackgesDetail: PackageDetail[];
}

interface AddressDetails {
  Code: string;
  Name: string;
  Address: string;
  City: string;
  State: string;
  ZipCode: string;
  Mobile: string;
  Email: string;
  Lat: string;
  Long: string;
  GSTNo: string;
}

interface BookingFormData {
  DivisionId: number;
  OperationType: 'I' | 'U';
  GRNo: string;
  GRDate: string;
  GRTime: string;
  PickupPinCode: string;
  PickupAreaName: string;
  DeliveryPinCode: string;
  DeliveryAreaName: string;
  ModeType: string;
  LoadType: string;
  BookingMode: string;
  CustomerCode: string;
  CustomerDepartmentId: string;
  BookingReferenceNo: string;
  TotalPcks: number;
  GrossWeight: number;
  ShipperDetails: AddressDetails;
  ConsigneeDetails: AddressDetails;
  InvoiceDetails: InvoiceDetail[];
}

export function GenerateBooking() {
  const [clientId, setClientId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successResponse, setSuccessResponse] = useState<any>(null);

  const [formData, setFormData] = useState<BookingFormData>({
    DivisionId: 1,
    OperationType: 'I',
    GRNo: '',
    GRDate: '',
    GRTime: '',
    PickupPinCode: '',
    PickupAreaName: '',
    DeliveryPinCode: '',
    DeliveryAreaName: '',
    ModeType: 'A',
    LoadType: 'P',
    BookingMode: 'R',
    CustomerCode: '',
    CustomerDepartmentId: '0',
    BookingReferenceNo: '',
    TotalPcks: 1,
    GrossWeight: 0,
    ShipperDetails: {
      Code: '',
      Name: '',
      Address: '',
      City: '',
      State: '',
      ZipCode: '',
      Mobile: '',
      Email: '',
      Lat: '',
      Long: '',
      GSTNo: '',
    },
    ConsigneeDetails: {
      Code: '',
      Name: '',
      Address: '',
      City: '',
      State: '',
      ZipCode: '',
      Mobile: '',
      Email: '',
      Lat: '',
      Long: '',
      GSTNo: '',
    },
    InvoiceDetails: [
      {
        InvoiceNo: '',
        InvoiceDate: '',
        InvoiceValue: 0,
        EwayBillNo: '',
        EwayBillDate: '',
        EwayBillValidUpto: '',
        PackgesDetail: [
          {
            PartNo: '',
            HSNCode: '',
            Article: '',
            PackingType: '',
            NoOfPckgs: 1,
            GrossWeight: 0,
            Length: 0,
            Width: 0,
            Height: 0,
            DimensionType: 'cm',
            VoluMetricWeight: 0,
          },
        ],
      },
    ],
  });

  const handleTopLevelChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'DivisionId' || name === 'TotalPcks' || name === 'GrossWeight' ? Number(value) : value,
    }));
  };

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'ShipperDetails' | 'ConsigneeDetails'
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        [name]: value,
      },
    }));
  };

  const handleInvoiceChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    invoiceIndex: number
  ) => {
    const { name, value } = e.target;
    const updatedInvoices = [...formData.InvoiceDetails];
    updatedInvoices[invoiceIndex] = {
      ...updatedInvoices[invoiceIndex],
      [name]: name === 'InvoiceValue' ? Number(value) : value,
    };
    setFormData({ ...formData, InvoiceDetails: updatedInvoices });
  };

  const handlePackageChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    invoiceIndex: number,
    packageIndex: number
  ) => {
    const { name, value } = e.target;
    const updatedInvoices = [...formData.InvoiceDetails];
    const updatedPackages = [...updatedInvoices[invoiceIndex].PackgesDetail];
    updatedPackages[packageIndex] = {
      ...updatedPackages[packageIndex],
      [name]: ['NoOfPckgs', 'GrossWeight', 'Length', 'Width', 'Height', 'VoluMetricWeight'].includes(name)
        ? Number(value)
        : value,
    };
    updatedInvoices[invoiceIndex].PackgesDetail = updatedPackages;
    setFormData({ ...formData, InvoiceDetails: updatedInvoices });
  };

  const addInvoice = () => {
    setFormData((prev) => ({
      ...prev,
      InvoiceDetails: [
        ...prev.InvoiceDetails,
        {
          InvoiceNo: '',
          InvoiceDate: '',
          InvoiceValue: 0,
          EwayBillNo: '',
          EwayBillDate: '',
          EwayBillValidUpto: '',
          PackgesDetail: [
            {
              PartNo: '',
              HSNCode: '',
              Article: '',
              PackingType: '',
              NoOfPckgs: 1,
              GrossWeight: 0,
              Length: 0,
              Width: 0,
              Height: 0,
              DimensionType: 'cm',
              VoluMetricWeight: 0,
            },
          ],
        },
      ],
    }));
  };

  const removeInvoice = (index: number) => {
    if (formData.InvoiceDetails.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      InvoiceDetails: prev.InvoiceDetails.filter((_, i) => i !== index),
    }));
  };

  const addPackage = (invoiceIndex: number) => {
    const updatedInvoices = [...formData.InvoiceDetails];
    updatedInvoices[invoiceIndex].PackgesDetail.push({
      PartNo: '',
      HSNCode: '',
      Article: '',
      PackingType: '',
      NoOfPckgs: 1,
      GrossWeight: 0,
      Length: 0,
      Width: 0,
      Height: 0,
      DimensionType: 'cm',
      VoluMetricWeight: 0,
    });
    setFormData({ ...formData, InvoiceDetails: updatedInvoices });
  };

  const removePackage = (invoiceIndex: number, packageIndex: number) => {
    const updatedInvoices = [...formData.InvoiceDetails];
    if (updatedInvoices[invoiceIndex].PackgesDetail.length === 1) return;
    updatedInvoices[invoiceIndex].PackgesDetail = updatedInvoices[invoiceIndex].PackgesDetail.filter(
      (_, i) => i !== packageIndex
    );
    setFormData({ ...formData, InvoiceDetails: updatedInvoices });
  };

  const handleSubmit = async () => {
    if (!clientId.trim()) {
      setError('Client ID is required');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessResponse(null);

    try {
      const response = await fetch('https://greentrans.in:444/API/GTAPP/GenerateBooking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Client-ID': clientId.trim(),
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.CommandStatus === 1 || result.CommandStatus === '1') {
        setSuccessResponse(result);
      } else {
        throw new Error(result.CommandMessage || 'Booking failed');
      }
    } catch (err: any) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 rounded-xl shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Package className="w-8 h-8 text-green-600" />
        <h1 className="text-3xl font-bold text-gray-800">Generate Booking</h1>
      </div>

      {/* Client ID Header */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">Client ID (Header) *</label>
        <input
          type="text"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="Enter your Client ID (provided via email)"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>

      {/* General Booking Details */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">Booking Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Division ID</label>
            <input
              type="number"
              name="DivisionId"
              value={formData.DivisionId}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Operation Type</label>
            <select
              name="OperationType"
              value={formData.OperationType}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="I">Insert (New Booking)</option>
              <option value="U">Update</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GR No</label>
            <input
              type="text"
              name="GRNo"
              value={formData.GRNo}
              onChange={handleTopLevelChange}
              placeholder="e.g., 12584"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GR Date (YYYY-MM-DD)</label>
            <input
              type="date"
              name="GRDate"
              value={formData.GRDate}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">GR Time (HH:MM)</label>
            <input
              type="text"
              name="GRTime"
              value={formData.GRTime}
              onChange={handleTopLevelChange}
              placeholder="e.g., 14:30"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mode Type</label>
            <select
              name="ModeType"
              value={formData.ModeType}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="A">AIR</option>
              <option value="S">SURFACE</option>
              <option value="T">TRAIN</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Load Type</label>
            <select
              name="LoadType"
              value={formData.LoadType}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="P">PART LOAD</option>
              <option value="F">FTL</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking Mode</label>
            <select
              name="BookingMode"
              value={formData.BookingMode}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="F">FOC</option>
              <option value="C">PAID</option>
              <option value="R">TBB</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Pin Code</label>
            <input
              type="text"
              name="PickupPinCode"
              value={formData.PickupPinCode}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Area Name</label>
            <input
              type="text"
              name="PickupAreaName"
              value={formData.PickupAreaName}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Pin Code</label>
            <input
              type="text"
              name="DeliveryPinCode"
              value={formData.DeliveryPinCode}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Area Name</label>
            <input
              type="text"
              name="DeliveryAreaName"
              value={formData.DeliveryAreaName}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer Code</label>
            <input
              type="text"
              name="CustomerCode"
              value={formData.CustomerCode}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Booking Reference No</label>
            <input
              type="text"
              name="BookingReferenceNo"
              value={formData.BookingReferenceNo}
              onChange={handleTopLevelChange}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Total Packages</label>
            <input
              type="number"
              name="TotalPcks"
              value={formData.TotalPcks}
              onChange={handleTopLevelChange}
              min="1"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Gross Weight (kg)</label>
            <input
              type="number"
              name="GrossWeight"
              value={formData.GrossWeight}
              onChange={handleTopLevelChange}
              step="0.01"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>
      </div>

      {/* Shipper & Consignee */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Shipper */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Shipper Details</h2>
          <div className="grid grid-cols-1 gap-4">
            {['Code', 'Name', 'Address', 'City', 'State', 'ZipCode', 'Mobile', 'Email', 'GSTNo'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                <input
                  type="text"
                  name={field}
                  value={(formData.ShipperDetails as any)[field]}
                  onChange={(e) => handleAddressChange(e, 'ShipperDetails')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Consignee */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Consignee Details</h2>
          <div className="grid grid-cols-1 gap-4">
            {['Code', 'Name', 'Address', 'City', 'State', 'ZipCode', 'Mobile', 'Email', 'GSTNo'].map((field) => (
              <div key={field}>
                <label className="block text-sm font-medium text-gray-700 mb-1">{field}</label>
                <input
                  type="text"
                  name={field}
                  value={(formData.ConsigneeDetails as any)[field]}
                  onChange={(e) => handleAddressChange(e, 'ConsigneeDetails')}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Invoice Details</h2>
          <button
            type="button"
            onClick={addInvoice}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" />
            Add Invoice
          </button>
        </div>

        {formData.InvoiceDetails.map((invoice, invIdx) => (
          <div key={invIdx} className="border border-gray-300 rounded-lg p-5 mb-6 relative">
            <button
              type="button"
              onClick={() => removeInvoice(invIdx)}
              className="absolute top-4 right-4 text-red-600 hover:text-red-800"
              disabled={formData.InvoiceDetails.length === 1}
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <input
                type="text"
                name="InvoiceNo"
                value={invoice.InvoiceNo}
                onChange={(e) => handleInvoiceChange(e, invIdx)}
                placeholder="Invoice No"
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                name="InvoiceDate"
                value={invoice.InvoiceDate}
                onChange={(e) => handleInvoiceChange(e, invIdx)}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="number"
                name="InvoiceValue"
                value={invoice.InvoiceValue}
                onChange={(e) => handleInvoiceChange(e, invIdx)}
                placeholder="Invoice Value"
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="text"
                name="EwayBillNo"
                value={invoice.EwayBillNo}
                onChange={(e) => handleInvoiceChange(e, invIdx)}
                placeholder="E-Way Bill No"
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                name="EwayBillDate"
                value={invoice.EwayBillDate}
                onChange={(e) => handleInvoiceChange(e, invIdx)}
                className="px-3 py-2 border rounded-lg"
              />
              <input
                type="date"
                name="EwayBillValidUpto"
                value={invoice.EwayBillValidUpto}
                onChange={(e) => handleInvoiceChange(e, invIdx)}
                className="px-3 py-2 border rounded-lg"
              />
            </div>

            {/* Packages */}
            <div className="mt-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">Packages</h4>
                <button
                  type="button"
                  onClick={() => addPackage(invIdx)}
                  className="flex items-center gap-1 text-green-600 hover:text-green-800"
                >
                  <Plus className="w-4 h-4" />
                  Add Package
                </button>
              </div>

              {invoice.PackgesDetail.map((pkg, pkgIdx) => (
                <div key={pkgIdx} className="bg-gray-50 p-4 rounded-lg mb-3 relative">
                  <button
                    type="button"
                    onClick={() => removePackage(invIdx, pkgIdx)}
                    className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                    disabled={invoice.PackgesDetail.length === 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      name="PartNo"
                      value={pkg.PartNo}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="Part No"
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      name="HSNCode"
                      value={pkg.HSNCode}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="HSN Code"
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      name="Article"
                      value={pkg.Article}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="Article / Content"
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="text"
                      name="PackingType"
                      value={pkg.PackingType}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="Packing Type"
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="number"
                      name="NoOfPckgs"
                      value={pkg.NoOfPckgs}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="No of Packages"
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="number"
                      name="GrossWeight"
                      value={pkg.GrossWeight}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="Gross Weight"
                      step="0.01"
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="number"
                      name="Length"
                      value={pkg.Length}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="Length"
                      step="0.01"
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="number"
                      name="Width"
                      value={pkg.Width}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="Width"
                      step="0.01"
                      className="px-3 py-2 border rounded"
                    />
                    <input
                      type="number"
                      name="Height"
                      value={pkg.Height}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="Height"
                      step="0.01"
                      className="px-3 py-2 border rounded"
                    />
                    <select
                      name="DimensionType"
                      value={pkg.DimensionType}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      className="px-3 py-2 border rounded"
                    >
                      <option value="cm">CM</option>
                      <option value="inch">Inch</option>
                    </select>
                    <input
                      type="number"
                      name="VoluMetricWeight"
                      value={pkg.VoluMetricWeight}
                      onChange={(e) => handlePackageChange(e, invIdx, pkgIdx)}
                      placeholder="Volumetric Weight"
                      step="0.01"
                      className="px-3 py-2 border rounded"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Submit */}
      <div className="text-center">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="inline-flex items-center gap-3 px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Save className="w-6 h-6" />
          {loading ? 'Submitting Booking...' : 'Generate Booking'}
        </button>
      </div>

      {/* Response */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <strong>Error:</strong> {error}
        </div>
      )}

      {successResponse && (
        <div className="mt-6 p-6 bg-green-100 border border-green-400 rounded-lg">
          <h3 className="text-xl font-bold text-green-800 mb-2">Booking Successful!</h3>
          <p><strong>Status:</strong> {successResponse.CommandStatus}</p>
          <p><strong>Message:</strong> {successResponse.CommandMessage}</p>
        </div>
      )}
    </div>
  );
}