import { Copy, Code, CheckCircle } from 'lucide-react';
import { useState } from 'react';

export function APIIntegrationGuide() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-lead`;

  const examples = [
    {
      title: 'JavaScript / Node.js',
      code: `const response = await fetch('${apiUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customer_name: 'John Doe',
    customer_email: 'john@example.com',
    customer_phone: '+91-9876543210',
    customer_company_name: 'ABC Logistics',
    ticket_title: 'Delivery Issue',
    ticket_description: 'Package not delivered on time',
    ticket_type: 'complaint',
    ticket_priority: 'high',
    tracking_number: 'GRL-TRACK-001'
  })
});

const result = await response.json();
console.log(result);`,
    },
    {
      title: 'Python',
      code: `import requests
import json

url = '${apiUrl}'
payload = {
    'customer_name': 'John Doe',
    'customer_email': 'john@example.com',
    'customer_phone': '+91-9876543210',
    'customer_company_name': 'ABC Logistics',
    'ticket_title': 'Delivery Issue',
    'ticket_description': 'Package not delivered on time',
    'ticket_type': 'complaint',
    'ticket_priority': 'high',
    'tracking_number': 'GRL-TRACK-001'
}

response = requests.post(url, json=payload)
result = response.json()
print(result)`,
    },
    {
      title: 'cURL',
      code: `curl -X POST '${apiUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "customer_name": "John Doe",
    "customer_email": "john@example.com",
    "customer_phone": "+91-9876543210",
    "customer_company_name": "ABC Logistics",
    "ticket_title": "Delivery Issue",
    "ticket_description": "Package not delivered on time",
    "ticket_type": "complaint",
    "ticket_priority": "high",
    "tracking_number": "GRL-TRACK-001"
  }'`,
    },
  ];

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          API Integration Guide
        </h2>
        <p className="text-gray-600">
          Integrate Golden Roadways Logistics CRM with your external systems to automatically
          create tickets and manage leads.
        </p>
      </div>

      {/* API Endpoint */}
      <div className="mb-8 bg-gray-50 p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">API Endpoint</h3>
        <div className="bg-white p-4 rounded border border-gray-300 font-mono text-sm break-all">
          {apiUrl}
        </div>
        <p className="text-sm text-gray-600 mt-2">Method: POST</p>
      </div>

      {/* Request Parameters */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Request Parameters</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Field</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Type</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Required</th>
                <th className="text-left py-3 px-4 font-semibold text-gray-900">Description</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  field: 'customer_name',
                  type: 'string',
                  required: true,
                  desc: 'Full name of the customer',
                },
                {
                  field: 'customer_email',
                  type: 'string',
                  required: false,
                  desc: 'Email address of the customer',
                },
                {
                  field: 'customer_phone',
                  type: 'string',
                  required: false,
                  desc: 'Phone number of the customer',
                },
                {
                  field: 'customer_company_name',
                  type: 'string',
                  required: false,
                  desc: 'Company name if B2B customer',
                },
                {
                  field: 'customer_address',
                  type: 'string',
                  required: false,
                  desc: 'Customer address',
                },
                {
                  field: 'ticket_title',
                  type: 'string',
                  required: true,
                  desc: 'Title/subject of the ticket',
                },
                {
                  field: 'ticket_description',
                  type: 'string',
                  required: false,
                  desc: 'Detailed description of the issue',
                },
                {
                  field: 'ticket_type',
                  type: 'enum',
                  required: false,
                  desc: 'inquiry, complaint, delivery_issue, billing, other (default: inquiry)',
                },
                {
                  field: 'ticket_priority',
                  type: 'enum',
                  required: false,
                  desc: 'low, medium, high, urgent (default: medium)',
                },
                {
                  field: 'tracking_number',
                  type: 'string',
                  required: false,
                  desc: 'Shipment tracking number',
                },
                {
                  field: 'source',
                  type: 'string',
                  required: false,
                  desc: 'Source of lead (default: api)',
                },
              ].map((param, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-mono text-amber-600">{param.field}</td>
                  <td className="py-3 px-4 text-gray-600">{param.type}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        param.required
                          ? 'bg-red-100 text-red-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {param.required ? 'Yes' : 'No'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{param.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Response */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Response Format</h3>
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <pre className="overflow-x-auto text-sm text-gray-800">
            {`{
  "success": true,
  "message": "Lead and ticket created successfully",
  "data": {
    "ticket_id": "uuid",
    "ticket_number": "GRL-000001",
    "customer_id": "uuid"
  }
}`}
          </pre>
        </div>
      </div>

      {/* Code Examples */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Code className="w-5 h-5 mr-2" />
          Code Examples
        </h3>
        <div className="space-y-4">
          {examples.map((example, idx) => (
            <div key={idx} className="bg-gray-50 rounded-lg border border-gray-200">
              <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">{example.title}</h4>
                <button
                  onClick={() => copyToClipboard(example.code, idx)}
                  className="flex items-center space-x-1 px-3 py-1 bg-white text-gray-700 rounded hover:bg-gray-200 transition-colors text-sm"
                >
                  {copiedIndex === idx ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-4 overflow-x-auto text-sm bg-white text-gray-800 font-mono">
                {example.code}
              </pre>
            </div>
          ))}
        </div>
      </div>

      {/* Success Response */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="font-semibold text-green-900">Success Response</h4>
            <p className="text-green-800 text-sm mt-1">
              HTTP Status: 201 Created. The ticket is created and a unique ticket number (GRL-XXXXXX)
              is automatically assigned. Use the returned ticket_number to reference the ticket in your
              system.
            </p>
          </div>
        </div>
      </div>

      {/* Error Handling */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Handling</h3>
        <div className="space-y-3">
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <p className="font-semibold text-red-900">400 Bad Request</p>
            <p className="text-sm text-red-800 mt-1">
              Missing required fields (customer_name, ticket_title) or invalid data format
            </p>
          </div>
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <p className="font-semibold text-red-900">401 Unauthorized</p>
            <p className="text-sm text-red-800 mt-1">Invalid or missing API key (if configured)</p>
          </div>
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <p className="font-semibold text-red-900">500 Internal Server Error</p>
            <p className="text-sm text-red-800 mt-1">Server error while processing the request</p>
          </div>
        </div>
      </div>
    </div>
  );
}
