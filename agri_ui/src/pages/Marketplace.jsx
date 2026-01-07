import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEscrow } from '../hooks/useEscrow';
import { useSupplyChain } from '../hooks/useSupplyChain';
import { ShoppingCart, Plus, TrendingUp, Award } from 'lucide-react';
import ListingCard from '../components/ListingCard';
import BidForm from '../components/BidForm';
import OrderPanel from '../components/OrderPanel';
import CreateListingForm from '../components/CreateListingForm';

const API_URL = import.meta.env.VITE_API_URL || 'https://agri-backend-2025-dxfkavfcamg0ebby.southindia-01.azurewebsites.net';

export default function Marketplace() {
  const { user } = useAuth();
  const { depositEscrow, releasePayment } = useEscrow();
  const { addBuyerAsDistributor } = useSupplyChain();
  const navigate = useNavigate();

  // View states
  const [activeTab, setActiveTab] = useState('browse'); // browse, my-listings, my-orders, create
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [bids, setBids] = useState([]);
  const [myOrders, setMyOrders] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sellerRatings, setSellerRatings] = useState({});

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  if (!user) return null;

  // Fetch all listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/marketplace/listings?status=active`);
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      setListings(data.listings || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch listing details with bids
  const fetchListingDetails = async (listingId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/marketplace/listings/${listingId}`);
      if (!response.ok) throw new Error('Failed to fetch listing details');
      const data = await response.json();
      setSelectedListing(data.listing);
      setBids(data.bids || []);

      // Fetch seller rating
      const ratingResponse = await fetch(`${API_URL}/api/marketplace/sellers/${data.listing.seller_id}/ratings`);
      if (ratingResponse.ok) {
        const ratingData = await ratingResponse.json();
        setSellerRatings(prev => ({
          ...prev,
          [data.listing.seller_id]: ratingData
        }));
      }
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's orders
  const fetchMyOrders = async () => {
    try {
      setLoading(true);
      // Farmer = seller (they list produce)
      // Retailer = buyer (they bid on produce)
      const isSeller = user.role === 'farmer';
      const endpoint = isSeller
        ? `${API_URL}/api/marketplace/orders/seller/${user.id}`
        : `${API_URL}/api/marketplace/orders/buyer/${user.id}`;

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setMyOrders(data.orders || []);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's listings (if farmer)
  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/marketplace/listings`);
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      const filtered = data.listings.filter(l => l.seller_id === user.id);
      setMyListings(filtered);
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete listing
  const handleDeleteListing = async (listingId, listingName) => {
    if (!window.confirm(`Are you sure you want to remove the listing for ${listingName}?`)) {
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/marketplace/listings/${listingId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerId: user.id })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to delete listing');
        return;
      }

      setSuccess(`✅ Listing for "${listingName}" has been removed from marketplace`);
      setTimeout(() => setSuccess(''), 5000);

      // Refresh listings
      await fetchMyListings();
      await fetchListings();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Place bid
  const handlePlaceBid = async (bidData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/marketplace/bids`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bidData)
      });

      if (!response.ok) throw new Error('Failed to place bid');
      const data = await response.json();
      
      setSuccess(`Bid placed successfully! Total: ₹${data.totalBidAmount.toFixed(2)}`);
      setTimeout(() => setSuccess(''), 5000);

      // Refresh listing details
      if (selectedListing) {
        await fetchListingDetails(selectedListing.id);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Accept bid (seller action) - WITH ESCROW + BLOCKCHAIN LINKAGE
  const handleAcceptBid = async (bidId) => {
    if (!window.confirm('Accept this bid? This will link buyer to blockchain batch and create escrow.')) return;

    try {
      setLoading(true);
      
      // Find the bid in current bids list to get details
      const bidData = bids.find(b => b.id === bidId);
      if (!bidData) {
        throw new Error('Bid not found in local state');
      }

      // Step 1: Create order in database first
      const response = await fetch(`${API_URL}/api/marketplace/bids/${bidId}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ txHash: null })
      });

      if (!response.ok) throw new Error('Failed to accept bid');
      const orderData = await response.json();

      setSuccess('Order created! Linking buyer to blockchain batch...');

      // Step 2: ADD BUYER AS DISTRIBUTOR TO BLOCKCHAIN BATCH
      // This creates the link: Farmer's batch → Buyer (as distributor)
      const blockchainLinkResult = await addBuyerAsDistributor(
        selectedListing.batch_id,        // Link to farmer's batch on blockchain
        selectedListing.crop_name,       // Verify crop name
        bidData.buyer_name,              // Buyer's name as "distributor"
        bidData.bid_quantity_kg,         // Quantity ordered
        bidData.total_bid_amount,        // Price paid
        'Marketplace'                    // Buyer location
      );

      if (!blockchainLinkResult.success) {
        console.warn('Could not link buyer to blockchain batch:', blockchainLinkResult.message);
        // Continue with escrow even if blockchain link fails
      } else {
        setSuccess('✅ Buyer linked to blockchain batch!');
      }

      // Generate a deterministic wallet address from seller ID for escrow
      // Format: 0x + padded seller ID (this is a workaround since we don't have real wallet addresses)
      const sellerWallet = '0x' + selectedListing.seller_id.toString().padStart(40, '0');

      // Step 3: Call escrow smart contract to deposit funds with batch_id linkage
      const escrowResult = await depositEscrow(
        orderData.orderId,
        selectedListing.batch_id,  // Link order to blockchain batch
        sellerWallet,
        bidData.total_bid_amount // amount in rupees
      );

      if (escrowResult.success) {
        // Step 4: Update order with blockchain TX hash
        await fetch(`${API_URL}/api/marketplace/orders/${orderData.orderId}/confirm-escrow`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ txHash: escrowResult.txHash })
        });

        // Show different message for farmer (seller) - they accepted the bid
        setSuccess(`✅ Bid accepted! Buyer ${bidData.buyer_name} has been notified. Waiting for batch submission...`);
        
        // Refresh listings
        if (selectedListing) {
          await fetchListingDetails(selectedListing.id);
        }
        await fetchMyListings();

        setTimeout(() => {
          setSuccess('');
        }, 4000);
      } else {
        setError(`Escrow failed: ${escrowResult.error}`);
      }
    } catch (err) {
      setError(err.message);
      console.error('Bid acceptance error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update delivery status - WITH ESCROW RELEASE
  const handleUpdateDelivery = async (orderId, status) => {
    try {
      setLoading(true);
      
      // Update delivery status in database
      const response = await fetch(`${API_URL}/api/marketplace/orders/${orderId}/delivery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!response.ok) throw new Error('Failed to update delivery');
      
      // If delivery is confirmed, release escrow payment to seller
      if (status === 'delivered') {
        setSuccess('Delivery confirmed! Processing escrow release...');
        
        const escrowResult = await releasePayment(orderId);
        if (escrowResult.success) {
          setSuccess(`✅ Delivery confirmed! Payment released: ${escrowResult.txHash.substring(0, 10)}...`);
        } else {
          setError(`Escrow release failed: ${escrowResult.error}`);
        }
      } else {
        setSuccess(`Order marked as ${status}`);
      }
      
      setTimeout(() => setSuccess(''), 5000);
      await fetchMyOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Submit review
  const handleSubmitReview = async (reviewData) => {
    try {
      setLoading(true);
      const order = myOrders.find(o => o.id === reviewData.orderId);
      
      const response = await fetch(`${API_URL}/api/marketplace/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...reviewData,
          reviewerId: user.id,
          reviewedId: order.seller_id
        })
      });

      if (!response.ok) throw new Error('Failed to submit review');
      
      setSuccess('Review submitted! Thank you.');
      setTimeout(() => setSuccess(''), 5000);

      await fetchMyOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create listing
  const handleCreateListing = async (listingData) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/marketplace/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(listingData)
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing');
      }
      
      setSuccess('Listing created successfully!');
      setTimeout(() => setSuccess(''), 5000);

      setActiveTab('my-listings');
      await fetchMyListings();
    } catch (err) {
      setError(err.message || 'Failed to create listing');
      console.error('Listing creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data based on active tab
  useEffect(() => {
    if (activeTab === 'browse') {
      fetchListings();
    } else if (activeTab === 'my-listings') {
      fetchMyListings();
    } else if (activeTab === 'my-orders') {
      fetchMyOrders();
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-green-800 flex items-center gap-3 mb-2">
            <ShoppingCart className="w-8 h-8" />
            Agricultural Marketplace
          </h1>
          <p className="text-gray-600">Trade produce directly with farmers and buyers</p>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded-lg mb-6">
            {success}
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {user.role === 'farmer' && (
            <button
              onClick={() => {
                setActiveTab('create');
                setSelectedListing(null);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'create'
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-green-600 border border-green-300 hover:bg-green-50'
              }`}
            >
              <Plus className="w-4 h-4" />
              Create Listing
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab('browse');
              setSelectedListing(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'browse'
                ? 'bg-green-600 text-white'
                : 'bg-white text-green-600 border border-green-300 hover:bg-green-50'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            Browse Listings
          </button>
          {user.role === 'farmer' && (
            <button
              onClick={() => {
                setActiveTab('my-listings');
                setSelectedListing(null);
              }}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'my-listings'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-blue-600 border border-blue-300 hover:bg-blue-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              My Listings
            </button>
          )}
          <button
            onClick={() => {
              setActiveTab('my-orders');
              setSelectedListing(null);
            }}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
              activeTab === 'my-orders'
                ? 'bg-amber-600 text-white'
                : 'bg-white text-amber-600 border border-amber-300 hover:bg-amber-50'
            }`}
          >
            <Award className="w-4 h-4" />
            My Orders
          </button>
        </div>

        {/* Content */}
        <div>
          {/* Browse Listings */}
          {activeTab === 'browse' && !selectedListing && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">No listings available yet.</p>
                </div>
              ) : (
                listings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onViewDetails={fetchListingDetails}
                    isOwner={listing.seller_id === user.id}
                  />
                ))
              )}
            </div>
          )}

          {/* Listing Details */}
          {selectedListing && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left: Listing Details */}
              <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6 space-y-4">
                <button
                  onClick={() => setSelectedListing(null)}
                  className="text-blue-600 hover:text-blue-800 font-semibold mb-4"
                >
                  ← Back to Listings
                </button>

                <h2 className="text-3xl font-bold text-green-800">{selectedListing.crop_name}</h2>
                <p className="text-gray-600">Seller: {selectedListing.seller_name}</p>

                {/* Seller Rating */}
                {sellerRatings[selectedListing.seller_id] && (
                  <div className="bg-blue-50 border border-blue-200 rounded p-4">
                    <p className="text-sm text-gray-600 mb-1">Seller Rating</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-blue-600">
                        {sellerRatings[selectedListing.seller_id].avgRating.toFixed(1)}
                      </span>
                      <span className="text-gray-600">
                        / 5.0 ({sellerRatings[selectedListing.seller_id].reviewCount} reviews)
                      </span>
                    </div>
                  </div>
                )}

                {/* Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-gray-600 text-sm">Quantity</p>
                    <p className="text-2xl font-bold text-green-600">{selectedListing.quantity_kg} kg</p>
                  </div>
                  <div className="bg-gray-50 rounded p-4">
                    <p className="text-gray-600 text-sm">Price per kg</p>
                    <p className="text-2xl font-bold text-green-600">₹{selectedListing.asking_price_per_kg}</p>
                  </div>
                </div>

                {/* Bids List (for seller) */}
                {selectedListing.seller_id === user.id && bids.length > 0 && (
                  <div className="border-t pt-4">
                    <h3 className="font-bold text-lg mb-4">Bids Received ({bids.length})</h3>
                    <div className="space-y-3">
                      {bids.map(bid => (
                        <div key={bid.id} className="border border-gray-200 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{bid.buyer_name}</p>
                            <p className="text-sm text-gray-600">{bid.bid_quantity_kg} kg @ ₹{bid.bid_price_per_kg}/kg</p>
                            <p className="font-bold text-green-600">Total: ₹{bid.total_bid_amount}</p>
                            <p className="text-xs text-gray-500 mt-1">Status: {bid.status}</p>
                          </div>
                          {bid.status === 'pending' && (
                            <button
                              onClick={() => handleAcceptBid(bid.id)}
                              disabled={loading}
                              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-4 py-2 rounded"
                            >
                              {loading ? 'Accepting...' : 'Accept'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Bid Form (for buyers) */}
              {selectedListing.seller_id !== user.id && selectedListing.status === 'active' && (
                <div>
                  <BidForm
                    listing={selectedListing}
                    onSubmitBid={handlePlaceBid}
                    loading={loading}
                    buyerInfo={user}
                  />
                </div>
              )}
            </div>
          )}

          {/* My Listings */}
          {activeTab === 'my-listings' && !selectedListing && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500 text-lg">You haven't created any listings yet.</p>
                </div>
              ) : (
                myListings.map(listing => (
                  <ListingCard
                    key={listing.id}
                    listing={listing}
                    onViewDetails={fetchListingDetails}
                    isOwner={true}
                    onDelete={handleDeleteListing}
                    loading={loading}
                  />
                ))
              )}
            </div>
          )}

          {/* My Orders */}
          {activeTab === 'my-orders' && (
            <div className="space-y-4">
              {myOrders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg">
                  <p className="text-gray-500 text-lg">No orders yet.</p>
                </div>
              ) : (
                myOrders
                  .filter(order => order.payment_status !== 'submitted_for_approval')
                  .map(order => {
                    // Find the listing for this order to pass details
                    const orderListing = listings.find(l => l.id === order.listing_id);
                    // Farmer is seller, Retailer is buyer
                    const userRole = user.role === 'farmer' ? 'seller' : 'buyer';
                    return (
                      <OrderPanel
                        key={order.id}
                        order={order}
                        userRole={userRole}
                        onUpdateDelivery={handleUpdateDelivery}
                        onSubmitReview={handleSubmitReview}
                        loading={loading}
                        listing={orderListing}
                      />
                    );
                  })
              )}
            </div>
          )}

          {/* Create Listing */}
          {activeTab === 'create' && (
            <div className="max-w-2xl mx-auto">
              <CreateListingForm
                user={user}
                onSubmit={handleCreateListing}
                loading={loading}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
