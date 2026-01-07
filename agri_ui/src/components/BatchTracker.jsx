import React, { useState, useEffect } from 'react';
import { Package, ShoppingCart, Truck, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://agri-backend-2025-dxfkavfcamg0ebby.southindia-01.azurewebsites.net';

export default function BatchTracker({ batchId }) {
  const [supplyChainData, setSupplyChainData] = useState(null);
  const [marketplaceOrders, setMarketplaceOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!batchId) return;
    fetchBatchData();
  }, [batchId]);

  const fetchBatchData = async () => {
    try {
      setLoading(true);
      setError('');

      // Get supply chain data from blockchain
      const supplyChainResponse = await fetch(
        `${API_URL}/api/produce?batchId=${batchId}`
      );
      if (supplyChainResponse.ok) {
        const scData = await supplyChainResponse.json();
        setSupplyChainData(scData);
      }

      // Get all marketplace orders for this batch
      const ordersResponse = await fetch(
        `${API_URL}/api/marketplace/batch-orders?batchId=${batchId}`
      );
      if (ordersResponse.ok) {
        const ordersData = await ordersResponse.json();
        setMarketplaceOrders(ordersData.orders || []);
      }
    } catch (err) {
      console.error('Error fetching batch data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading batch journey...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold mb-6">🌾 Complete Batch Journey</h2>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
          <div>{error}</div>
        </div>
      )}

      {/* Supply Chain Tracker Data */}
      {supplyChainData && (
        <div className="mb-8 pb-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Package size={20} className="text-green-600" />
            Farm to Distribution
          </h3>

          <div className="space-y-4">
            {/* Farmer Info */}
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="font-semibold text-green-900">🚜 Farmer</div>
              <p className="text-sm text-gray-700 mt-2">
                <strong>{supplyChainData.farmerInfo.farmerName}</strong>
              </p>
              <p className="text-sm text-gray-600">
                {supplyChainData.farmerInfo.cropName} - {supplyChainData.farmerInfo.quantity} kg
              </p>
              <p className="text-sm text-gray-600">
                📍 {supplyChainData.farmerInfo.location}
              </p>
              <p className="text-sm text-gray-600">
                💰 ₹{supplyChainData.farmerInfo.pricePerKg}/kg
              </p>
            </div>

            {/* Distributors */}
            {supplyChainData.distributors?.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="font-semibold text-blue-900">🚛 Distributors</div>
                {supplyChainData.distributors.map((dist, idx) => (
                  <div key={idx} className="mt-3 text-sm">
                    <p className="font-medium">{dist.distributorName}</p>
                    <p className="text-gray-600">
                      {dist.quantityReceived} kg received | 📦 {dist.warehouseLocation}
                    </p>
                    <p className="text-gray-600">🚚 {dist.transportDetails}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Retailers */}
            {supplyChainData.retailers?.length > 0 && (
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="font-semibold text-purple-900">🏪 Retailers</div>
                {supplyChainData.retailers.map((ret, idx) => (
                  <div key={idx} className="mt-3 text-sm">
                    <p className="font-medium">{ret.retailerName}</p>
                    <p className="text-gray-600">
                      {ret.retailQuantity} kg in stock | 📍 {ret.shopLocation}
                    </p>
                    <p className="text-gray-600">💳 ₹{ret.consumerPrice}/kg to consumer</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Marketplace Orders (Escrow Tracking) */}
      {marketplaceOrders.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart size={20} className="text-orange-600" />
            Marketplace Orders & Escrow
          </h3>

          <div className="space-y-4">
            {marketplaceOrders.map((order) => (
              <div
                key={order.id}
                className={`p-4 rounded-lg border-2 ${
                  order.payment_status === 'released'
                    ? 'bg-green-50 border-green-200'
                    : order.payment_status === 'escrowed'
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold">Order #{order.id}</p>
                    <p className="text-sm text-gray-600">
                      {order.quantity_kg} kg @ ₹{order.price_per_kg}/kg = ₹{order.total_amount}
                    </p>
                  </div>
                  <div className="text-right">
                    {order.payment_status === 'released' ? (
                      <span className="flex items-center gap-1 text-green-700 font-semibold text-sm">
                        <CheckCircle size={16} />
                        COMPLETED
                      </span>
                    ) : order.payment_status === 'escrowed' ? (
                      <span className="flex items-center gap-1 text-yellow-700 font-semibold text-sm">
                        <Truck size={16} />
                        IN TRANSIT
                      </span>
                    ) : (
                      <span className="text-gray-600 text-sm">{order.payment_status}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm text-gray-700">
                  <p>👤 Buyer: {order.buyer_name} ({order.buyer_email})</p>
                  <p>📦 Delivery: {order.delivery_status || 'Pending'}</p>
                  {order.tx_hash && (
                    <p className="text-xs text-gray-500">
                      TX: {order.tx_hash.substring(0, 20)}...
                    </p>
                  )}
                </div>

                {order.review_rating && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-200">
                    <p className="font-semibold text-sm">⭐ Rating: {order.review_rating}/5</p>
                    <p className="text-sm text-gray-700">{order.review_comment}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {!supplyChainData && marketplaceOrders.length === 0 && !error && (
        <div className="text-center p-8 text-gray-500">
          <Package size={40} className="mx-auto mb-4 opacity-50" />
          <p>No data available for this batch yet</p>
        </div>
      )}
    </div>
  );
}
