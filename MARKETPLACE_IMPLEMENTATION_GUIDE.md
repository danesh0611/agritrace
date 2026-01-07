# 🎯 Marketplace Implementation Guide

## ✅ What Was Implemented

A complete **B2B Agricultural Marketplace** with the following features:

### Core Features
- **Listings Management**: Farmers can create/manage produce listings
- **Smart Bidding System**: Buyers place bids on listings, sellers accept/reject
- **Escrow Payment**: Secure payment handling via smart contract
- **Order Tracking**: Real-time order status updates (pending → shipped → delivered)
- **Review System**: Buyers can rate sellers after delivery
- **Seller Ratings**: Aggregate seller scores from reviews

---

## 📊 Database Schema

### 4 New Tables Created in SQL Server

#### 1. `marketplace_listings`
```sql
- id (PK)
- batch_id (UNIQUE - links to blockchain)
- seller_id, seller_email, seller_name
- crop_name, quantity_kg, asking_price_per_kg
- quality_grade (Grade-A, B, C)
- harvest_date, delivery_location
- status (active, sold, cancelled)
- created_at, updated_at
```

#### 2. `marketplace_bids`
```sql
- id (PK)
- listing_id (FK → listings)
- buyer_id, buyer_email, buyer_name
- bid_quantity_kg, bid_price_per_kg, total_bid_amount
- status (pending, accepted, rejected, completed)
- created_at, updated_at
```

#### 3. `marketplace_orders`
```sql
- id (PK)
- bid_id (FK → bids), listing_id (FK → listings)
- batch_id, seller_id, buyer_id
- quantity_kg, price_per_kg, total_amount
- payment_status (pending, paid, escrowed, released)
- delivery_status (pending, shipped, delivered, cancelled)
- tx_hash (blockchain transaction hash)
- created_at, updated_at
```

#### 4. `marketplace_reviews`
```sql
- id (PK)
- order_id (FK → orders)
- reviewer_id, reviewed_id
- rating (1-5), comment
- created_at
```

---

## 🔌 Backend API Endpoints (11 Total)

### Listings Management
```
POST   /api/marketplace/listings           → Create listing
GET    /api/marketplace/listings           → Browse all listings (with status filter)
GET    /api/marketplace/listings/:id       → Get listing details with bids
```

### Bidding System
```
POST   /api/marketplace/bids               → Place a bid
GET    /api/marketplace/listings/:id/bids  → Get all bids for listing (seller view)
POST   /api/marketplace/bids/:id/accept    → Accept bid (creates order)
```

### Order Management
```
GET    /api/marketplace/orders/buyer/:id   → Get buyer's orders
GET    /api/marketplace/orders/seller/:id  → Get seller's orders
POST   /api/marketplace/orders/:id/delivery → Update delivery status
```

### Reviews & Ratings
```
POST   /api/marketplace/reviews            → Submit review
GET    /api/marketplace/sellers/:id/ratings → Get seller's rating stats
```

---

## 💰 Smart Contract: Escrow System

### New Contract: `MarketplaceEscrow`

**Features:**
- Buyers deposit funds in escrow during order creation
- Seller confirms delivery → funds released to seller wallet
- Buyer initiates refund if delivery fails → funds returned
- Users can withdraw their balance anytime

**Key Functions:**
```solidity
depositEscrow(orderId, seller)     // Buyer deposits payment
releasePayment(orderId)             // Seller receives funds
refundPayment(orderId)              // Buyer gets refund
withdrawFunds(amount)               // Withdraw earnings
```

**States:**
- `escrowed` → Funds held in contract
- `released` → Payment sent to seller
- `refunded` → Payment returned to buyer

---

## 🎨 Frontend Components

### 1. **ListingCard.jsx**
Displays produce listing in grid
- Crop name, seller, quality grade
- Quantity & pricing summary
- Status badge
- "Place Bid" or "View Bids" button

### 2. **BidForm.jsx**
Buyer bidding interface
- Quantity selector (with max validation)
- Price per kg input
- Live bid calculation
- Price variance indicator (+/- from asking price)
- Escrow terms explanation

### 3. **OrderPanel.jsx**
Order management & review system
- Payment & delivery status tracking
- Seller: Mark as shipped
- Buyer: Confirm delivery
- Star rating + comment form
- Blockchain TX hash display

### 4. **CreateListingForm.jsx**
Farmer listing creation
- Batch ID, crop name
- Quantity & price inputs
- Quality grade dropdown
- Harvest date picker
- Delivery location field
- Live total value calculation

### 5. **Marketplace.jsx** (Main Page)
Dashboard with 4 tabs:
- **Browse Listings** - All available produce
- **Create Listing** - (Farmers only) Sell produce
- **My Listings** - (Farmers only) Manage active listings
- **My Orders** - View & manage orders

---

## 🚀 Workflow: Complete Transaction Flow

### Farmer Perspective
```
1. Go to Marketplace → "Create Listing"
2. Fill form (batch ID, crop, quantity, price, etc.)
3. Submit → Listing goes live
4. View → "My Listings" tab
5. See incoming bids
6. Accept best bid → Order created
7. Mark as "Shipped" when delivered
8. View earnings in "My Orders"
```

### Buyer Perspective (Distributor/Retailer)
```
1. Browse → "Marketplace" page
2. Search/filter listings
3. Click listing → See details
4. Enter quantity & offer price
5. "Place Bid" → Funds go to escrow
6. Wait for seller acceptance
7. Seller ships → Status updates
8. Confirm delivery → Seller paid
9. Leave review → Rate seller
```

---

## 📱 UI/UX Features

### Status Indicators
- Color-coded badges (active, pending, shipped, delivered)
- Progress indicators for order lifecycle
- Seller rating display (stars + review count)

### Responsive Design
- Mobile-friendly card layouts
- Tab-based navigation
- Forms with validation
- Real-time error messages
- Success notifications

### Data Validations
- Quantity must not exceed available
- Price must be positive
- User must be logged in
- Email verification for bids/orders
- Seller can't bid on own listings

---

## 🔐 Security Features

1. **Database**: User IDs tied to all transactions
2. **API**: Input validation on all endpoints
3. **Smart Contract**: Escrow prevents fraud
4. **Status Tracking**: Immutable order history
5. **Blockchain**: TX hashes for transparency

---

## 💾 Database Connection

The marketplace uses the existing **SQL Server** connection from `agri_backend/index.js`:
- Server: `ledgerlegends.database.windows.net`
- Database: `reg_details`
- Automatic table creation on startup

---

## 🧪 Testing Checklist

### Backend Testing
```bash
# 1. Create listing
POST /api/marketplace/listings
{
  "batchId": "BATCH-2024-001",
  "sellerId": 1,
  "sellerEmail": "farmer@example.com",
  "cropName": "Tomatoes",
  "quantityKg": 100,
  "askingPricePerKg": 25.50,
  "qualityGrade": "Grade-A",
  "deliveryLocation": "Farm location"
}

# 2. Browse listings
GET /api/marketplace/listings?status=active

# 3. Place bid
POST /api/marketplace/bids
{
  "listingId": 1,
  "buyerId": 2,
  "buyerEmail": "buyer@example.com",
  "bidQuantityKg": 50,
  "bidPricePerKg": 26
}

# 4. Accept bid (creates order)
POST /api/marketplace/bids/1/accept

# 5. Update delivery
POST /api/marketplace/orders/1/delivery
{
  "status": "shipped"
}

# 6. Submit review
POST /api/marketplace/reviews
{
  "orderId": 1,
  "rating": 5,
  "comment": "Great quality produce!"
}
```

### Frontend Testing
```
1. Sign up as Farmer
2. Create listing with test batch ID
3. Sign up as Buyer (separate account)
4. Browse marketplace
5. Place bid on listing
6. Switch to farmer account
7. Accept bid
8. Mark as shipped
9. Switch to buyer
10. Confirm delivery
11. Leave 5-star review
12. View seller rating updated
```

---

## 📈 Future Enhancements

1. **Advanced Search/Filters**
   - By crop type, quality, price range, location
   - Sorting by price, newest, most bids

2. **Bulk Orders**
   - Allow buyers to purchase multiple listings in one transaction
   - Combine shipping

3. **Seller Analytics Dashboard**
   - Sales history, revenue trends
   - Buyer demographics
   - Performance metrics

4. **Payment Methods**
   - Credit card integration
   - UPI/Digital wallets
   - Crypto payments (via MetaMask)

5. **Logistics Integration**
   - Real-time GPS tracking
   - Automated delivery partner assignment
   - Insurance for shipments

6. **Smart Contracts Enhancements**
   - Automated escrow release based on conditions
   - Multi-sig approval for large orders
   - Futures trading (pre-harvest contracts)

7. **AI/ML**
   - Price prediction based on supply/demand
   - Quality assessment via image recognition
   - Fraud detection

---

## 🎓 Code Architecture

```
agri_ui/src/
├── pages/
│   └── Marketplace.jsx          ← Main page (state management)
├── components/
│   ├── ListingCard.jsx          ← Display listings
│   ├── BidForm.jsx              ← Buyer bidding
│   ├── OrderPanel.jsx           ← Order tracking + reviews
│   └── CreateListingForm.jsx    ← Farmer form
└── App.jsx                      ← Added route

agri_backend/
├── index.js                     ← 11 new API endpoints + 4 tables
└── package.json                 (no new dependencies)

ledger.sol
└── MarketplaceEscrow            ← New escrow contract
```

---

## 🚀 Deployment Steps

1. **Backend**: Tables created automatically on `npm start`
2. **Frontend**: Import components and add route (done)
3. **Smart Contract**: Deploy `MarketplaceEscrow` to your blockchain network
4. **Update `.env`**: Add contract address if needed

---

## 📞 Support

- All API endpoints return `{ success: true/false, data/error }`
- Error handling with try-catch on all endpoints
- Console logs for debugging
- Database validation on inserts

---

**Status**: ✅ READY TO USE
**Test Account**: Use same credentials from Auth system
**Data**: All persisted in SQL Server + Blockchain

Enjoy your marketplace! 🎉
