import React, { useState } from 'react';
import { CheckCircle, XCircle, Clock, Star, MessageSquare } from 'lucide-react';
import BuyerSubmissionNotice from './BuyerSubmissionNotice';

export default function OrderPanel({ order, userRole, onUpdateDelivery, onSubmitReview, loading = false, listing = null }) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const handleDeliveryUpdate = async (status) => {
    if (window.confirm(`Mark this order as ${status}?`)) {
      await onUpdateDelivery(order.id, status);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      alert('Please write a comment');
      return;
    }
    await onSubmitReview({
      orderId: order.id,
      rating,
      comment
    });
    setShowReviewForm(false);
    setComment('');
    setRating(5);
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'escrowed': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-green-100 text-green-800';
      case 'released': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const statusIcon = (status) => {
    switch(status) {
      case 'delivered':
      case 'released':
      case 'paid':
        return <CheckCircle className="w-5 h-5" />;
      case 'shipped':
        return <Clock className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-300 p-6 space-y-4">
      {/* BUYER NOTIFICATION: Submit to approval form */}
      {userRole === 'buyer' && order.payment_status === 'escrowed' && order.batch_id && (
        <BuyerSubmissionNotice 
          orderId={order.id}
          batchId={order.batch_id}
          sellerName={order.seller_name || 'Farmer'}
          listingDetails={listing}
          onSubmitted={() => window.location.reload()}
        />
      )}

      {/* Order Header */}
      <div className="flex justify-between items-start border-b pb-4">
        <div>
          <h4 className="font-bold text-lg">Order #{order.id}</h4>
          <p className="text-sm text-gray-500">Batch: {order.batch_id}</p>
          <p className="text-sm text-gray-500">Created: {new Date(order.created_at).toLocaleDateString()}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-green-600">₹{order.total_amount.toFixed(2)}</p>
          <p className="text-sm">{order.quantity_kg} kg @ ₹{order.price_per_kg}/kg</p>
        </div>
      </div>

      {/* Status Badges */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">PAYMENT STATUS</p>
          <div className={`flex items-center gap-2 px-3 py-2 rounded ${getStatusColor(order.payment_status)}`}>
            {statusIcon(order.payment_status)}
            <span className="font-semibold">{order.payment_status.toUpperCase()}</span>
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">DELIVERY STATUS</p>
          <div className={`flex items-center gap-2 px-3 py-2 rounded ${getStatusColor(order.delivery_status)}`}>
            {statusIcon(order.delivery_status)}
            <span className="font-semibold">{order.delivery_status.toUpperCase()}</span>
          </div>
        </div>
      </div>

      {/* Seller Actions (for sellers) */}
      {userRole === 'seller' && order.delivery_status === 'pending' && (
        <div className="bg-blue-50 border border-blue-200 rounded p-3">
          <p className="text-sm font-semibold text-blue-900 mb-2">Seller Actions:</p>
          <button
            onClick={() => handleDeliveryUpdate('shipped')}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded transition-colors"
          >
            {loading ? 'Updating...' : 'Mark as Shipped'}
          </button>
        </div>
      )}

      {/* Buyer Actions (for buyers) */}
      {userRole === 'buyer' && order.delivery_status === 'shipped' && (
        <div className="bg-green-50 border border-green-200 rounded p-3">
          <p className="text-sm font-semibold text-green-900 mb-2">Buyer Actions:</p>
          <button
            onClick={() => handleDeliveryUpdate('delivered')}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded transition-colors"
          >
            {loading ? 'Updating...' : 'Confirm Delivery'}
          </button>
        </div>
      )}

      {/* Review Section (after delivery) */}
      {userRole === 'buyer' && order.delivery_status === 'delivered' && !showReviewForm && (
        <button
          onClick={() => setShowReviewForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-900 font-semibold py-2 rounded transition-colors border border-amber-300"
        >
          <Star className="w-4 h-4" />
          Leave a Review
        </button>
      )}

      {/* Review Form */}
      {showReviewForm && (
        <form onSubmit={handleReviewSubmit} className="bg-amber-50 border border-amber-200 rounded p-4 space-y-3">
          <h5 className="font-bold text-amber-900">Rate Your Experience</h5>

          {/* Star Rating */}
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-2 rounded transition-colors ${
                  star <= rating 
                    ? 'bg-yellow-400 text-white' 
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
            ))}
          </div>

          {/* Comment */}
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience..."
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500"
            rows="3"
            required
          />

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white font-bold py-2 rounded transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
            <button
              type="button"
              onClick={() => setShowReviewForm(false)}
              className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 rounded transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* TX Hash */}
      {order.tx_hash && (
        <div className="bg-gray-50 rounded p-3 text-xs">
          <p className="font-semibold text-gray-700 mb-1">Blockchain TX:</p>
          <p className="text-gray-600 break-all">{order.tx_hash}</p>
        </div>
      )}
    </div>
  );
}
