import React from 'react';
import { MapPin, Leaf, Calendar, DollarSign, TrendingUp, Trash2 } from 'lucide-react';

export default function ListingCard({ listing, onViewDetails, isOwner = false, onDelete = null, loading = false }) {
  const totalValue = listing.quantity_kg * listing.asking_price_per_kg;
  const daysOld = Math.floor((Date.now() - new Date(listing.created_at).getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow overflow-hidden border border-green-100">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-4 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold">{listing.crop_name}</h3>
            <p className="text-green-100 text-sm">{listing.seller_name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            listing.status === 'active' ? 'bg-green-300 text-green-900' : 'bg-gray-300 text-gray-900'
          }`}>
            {listing.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Quality & Harvest */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-green-600" />
            <span>Grade: {listing.quality_grade}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{daysOld} days old</span>
          </div>
        </div>

        {/* Quantity & Price */}
        <div className="border-t border-b py-3 space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Quantity Available</span>
            <span className="font-bold text-lg">{listing.quantity_kg} kg</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Price per kg</span>
            <span className="font-bold text-lg text-green-600">₹{listing.asking_price_per_kg.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center bg-green-50 p-2 rounded">
            <span className="text-gray-700 font-semibold">Total Value</span>
            <span className="font-bold text-green-700">₹{totalValue.toFixed(2)}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
          <span>{listing.delivery_location}</span>
        </div>

        {/* Seller Email */}
        <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          Seller: {listing.seller_email}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onViewDetails(listing.id)}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            {isOwner ? 'View Bids' : 'Place Bid'}
          </button>
          {isOwner && onDelete && (
            <button
              onClick={() => onDelete(listing.id, listing.crop_name)}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
              title="Remove this listing"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Remove</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
