import React, { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://agri-backend-2025-dxfkavfcamg0ebby.southindia-01.azurewebsites.net';

export default function BuyerSubmissionNotice({ orderId, batchId, sellerName, listingDetails, onSubmitted }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCopyBatchId = () => {
    navigator.clipboard.writeText(batchId);
    alert('✅ Batch ID copied to clipboard!');
  };

  const handleSubmitToApproval = async () => {
    if (!window.confirm('This will submit the order to the approval form and remove it from marketplace. Continue?')) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await fetch(`${API_URL}/api/marketplace/orders/${orderId}/submit-to-approval`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error('Failed to submit order');
      }

      alert('✅ Order submitted to approval form! It has been removed from marketplace.');
      if (onSubmitted) onSubmitted();
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg">
      <div className="flex items-start gap-3 mb-4">
        <AlertCircle size={24} className="text-yellow-600 flex-shrink-0 mt-1" />
        <div>
          <h3 className="font-bold text-lg text-yellow-900">📋 Action Required</h3>
          <p className="text-sm text-yellow-800 mt-1">
            {sellerName} accepted your bid! Now submit this to the approval form.
          </p>
        </div>
      </div>

      {/* Batch ID Display */}
      <div className="mb-4 p-3 bg-white border border-yellow-200 rounded">
        <label className="block text-xs font-semibold text-gray-600 mb-2">BATCH ID:</label>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-sm font-mono text-gray-800 break-all">{batchId}</code>
          <button
            onClick={handleCopyBatchId}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 whitespace-nowrap"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Listing Details */}
      {listingDetails && (
        <div className="mb-4 p-3 bg-white border border-yellow-200 rounded text-sm">
          <p><strong>Crop:</strong> {listingDetails.crop_name}</p>
          <p><strong>Quantity:</strong> {listingDetails.quantity_kg} kg</p>
          <p><strong>Price:</strong> ₹{listingDetails.price_per_kg}/kg</p>
        </div>
      )}

      {/* Instructions */}
      <div className="space-y-2 text-sm text-gray-800 mb-4">
        <p className="font-semibold">📌 Next Steps:</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Copy the Batch ID above</li>
          <li>Go to <strong>"Distributor Approval Form"</strong> page</li>
          <li>Enter the Batch ID and product details</li>
          <li>Submit for farmer approval</li>
          <li>Once approved, you'll complete the transaction</li>
        </ol>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <a
          href={`/distributor-approval?orderId=${orderId}&batchId=${batchId}`}
          className="block w-full px-4 py-2 bg-yellow-600 text-white text-center font-semibold rounded-lg hover:bg-yellow-700 transition"
        >
          ➜ Go to Approval Form
        </a>
      </div>
    </div>
  );
}
