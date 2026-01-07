import React, { useState } from 'react';
import { Send, AlertCircle } from 'lucide-react';

export default function BidForm({ listing, onSubmitBid, loading = false, buyerInfo }) {
  const [quantity, setQuantity] = useState(1);
  const [pricePerKg, setPricePerKg] = useState(listing.asking_price_per_kg);
  const [error, setError] = useState('');

  const totalBid = (quantity * pricePerKg).toFixed(2);
  const priceVariance = ((pricePerKg - listing.asking_price_per_kg) / listing.asking_price_per_kg * 100).toFixed(1);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!quantity || quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if (quantity > listing.quantity_kg) {
      setError(`Maximum available: ${listing.quantity_kg} kg`);
      return;
    }

    if (!pricePerKg || pricePerKg <= 0) {
      setError('Price must be greater than 0');
      return;
    }

    if (!buyerInfo?.id || !buyerInfo?.email) {
      setError('You must be logged in to place a bid');
      return;
    }

    await onSubmitBid({
      listingId: listing.id,
      buyerId: buyerInfo.id,
      buyerEmail: buyerInfo.email,
      buyerName: buyerInfo.username,
      bidQuantityKg: quantity,
      bidPricePerKg: pricePerKg
    });

    setQuantity(1);
    setPricePerKg(listing.asking_price_per_kg);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-blue-200 p-6 space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Place Your Bid</h3>

      {error && (
        <div className="flex gap-2 bg-red-50 border border-red-200 text-red-700 p-3 rounded">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quantity */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Quantity (kg) - Max: {listing.quantity_kg} kg
        </label>
        <input
          type="number"
          min="0.1"
          max={listing.quantity_kg}
          step="0.1"
          value={quantity}
          onChange={(e) => setQuantity(parseFloat(e.target.value))}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Price per kg */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Price per kg (₹)
          <span className={`ml-2 text-xs font-normal ${priceVariance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {priceVariance > 0 ? '+' : ''}{priceVariance}%
          </span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2.5 text-gray-600">₹</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={pricePerKg}
            onChange={(e) => setPricePerKg(parseFloat(e.target.value))}
            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Asking price: ₹{listing.asking_price_per_kg.toFixed(2)}/kg</p>
      </div>

      {/* Total bid summary */}
      <div className="bg-blue-50 border border-blue-200 rounded p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-700">Quantity</span>
          <span className="font-semibold">{quantity} kg</span>
        </div>
        <div className="flex justify-between items-center border-b border-blue-200 pb-2 mb-2">
          <span className="text-gray-700">Unit Price</span>
          <span className="font-semibold">₹{pricePerKg.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="font-bold text-gray-800">Total Bid</span>
          <span className="text-2xl font-bold text-blue-600">₹{totalBid}</span>
        </div>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded">
        <p className="font-semibold mb-1">Terms:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Your bid amount will be held in escrow</li>
          <li>Funds released to seller upon delivery confirmation</li>
          <li>You can withdraw if bid is rejected</li>
        </ul>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition-colors"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Placing Bid...' : 'Place Bid'}
      </button>
    </form>
  );
}
