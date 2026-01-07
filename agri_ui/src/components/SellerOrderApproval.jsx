import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://agri-backend-2025-dxfkavfcamg0ebby.southindia-01.azurewebsites.net';

export default function SellerOrderApproval({ orderId, status, currentBatchId, onApprove }) {
  const [batchId, setBatchId] = useState(currentBatchId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmitBatchId = async () => {
    if (!batchId.trim()) {
      setError('Please enter a batch ID');
      return;
    }

    // Validate batch ID format (66 chars, starts with 0x for bytes32)
    if (batchId.length !== 66 || !batchId.startsWith('0x')) {
      setError('Invalid batch ID format. Should be 66 characters starting with 0x');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Update order with batch_id and status
      const response = await fetch(`${API_URL}/api/marketplace/orders/${orderId}/approve-batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: batchId,
          status: 'batch_approved'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to approve batch');
      }

      setSuccess('✅ Batch ID approved! Retailer can now see the linked batch.');
      setTimeout(() => {
        setSuccess('');
        if (onApprove) onApprove(batchId);
      }, 2000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Show status badges
  const getStatusBadge = () => {
    switch (status) {
      case 'batch_approved':
        return <span className="text-green-600 font-semibold flex items-center gap-1"><CheckCircle size={16} /> Batch Approved</span>;
      case 'pending_approval':
        return <span className="text-yellow-600 font-semibold flex items-center gap-1"><Clock size={16} /> Waiting for Batch ID</span>;
      default:
        return <span className="text-gray-600">Unknown</span>;
    }
  };

  return (
    <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">🌾 Farmer Batch Approval</h3>
        {getStatusBadge()}
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded flex items-start gap-2">
          <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 text-green-700 rounded flex items-start gap-2">
          <CheckCircle size={18} className="flex-shrink-0 mt-0.5" />
          <div>{success}</div>
        </div>
      )}

      {status === 'pending_approval' ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Enter your blockchain batch ID to link this order to your produce:
          </p>
          <input
            type="text"
            placeholder="0x... (66 character batch ID)"
            value={batchId}
            onChange={(e) => setBatchId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm"
            disabled={loading}
          />
          <button
            onClick={handleSubmitBatchId}
            disabled={loading || !batchId.trim()}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60 transition"
          >
            {loading ? 'Approving...' : '✓ Approve Batch ID'}
          </button>
        </div>
      ) : (
        <div className="p-3 bg-green-50 rounded border border-green-200">
          <p className="text-sm text-gray-700 mb-2">✅ Linked Batch ID:</p>
          <p className="font-mono text-sm text-green-700 break-all">{currentBatchId}</p>
        </div>
      )}

      <p className="text-xs text-gray-600 mt-4">
        💡 This links the marketplace order to your blockchain batch. Buyer will see proof of origin.
      </p>
    </div>
  );
}
