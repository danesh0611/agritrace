-- Marketplace Database Schema Creation Script
-- Run this if tables aren't automatically created

-- 1. LISTINGS TABLE
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='marketplace_listings' AND xtype='U')
CREATE TABLE marketplace_listings (
    id INT IDENTITY(1,1) PRIMARY KEY,
    batch_id NVARCHAR(255) NOT NULL UNIQUE,
    seller_id INT NOT NULL,
    seller_email NVARCHAR(255) NOT NULL,
    seller_name NVARCHAR(255) NOT NULL,
    crop_name NVARCHAR(255) NOT NULL,
    quantity_kg FLOAT NOT NULL,
    asking_price_per_kg FLOAT NOT NULL,
    quality_grade NVARCHAR(50),
    harvest_date DATETIME,
    delivery_location NVARCHAR(MAX),
    status NVARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled')),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);

-- 2. BIDS TABLE
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='marketplace_bids' AND xtype='U')
CREATE TABLE marketplace_bids (
    id INT IDENTITY(1,1) PRIMARY KEY,
    listing_id INT NOT NULL,
    buyer_id INT NOT NULL,
    buyer_email NVARCHAR(255) NOT NULL,
    buyer_name NVARCHAR(255) NOT NULL,
    bid_quantity_kg FLOAT NOT NULL,
    bid_price_per_kg FLOAT NOT NULL,
    total_bid_amount FLOAT NOT NULL,
    status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id)
);

-- 3. ORDERS TABLE
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='marketplace_orders' AND xtype='U')
CREATE TABLE marketplace_orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    bid_id INT NOT NULL,
    listing_id INT NOT NULL,
    batch_id NVARCHAR(255) NOT NULL,
    seller_id INT NOT NULL,
    buyer_id INT NOT NULL,
    quantity_kg FLOAT NOT NULL,
    price_per_kg FLOAT NOT NULL,
    total_amount FLOAT NOT NULL,
    payment_status NVARCHAR(50) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'escrowed', 'released')),
    delivery_status NVARCHAR(50) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'shipped', 'delivered', 'cancelled')),
    tx_hash NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (bid_id) REFERENCES marketplace_bids(id),
    FOREIGN KEY (listing_id) REFERENCES marketplace_listings(id)
);

-- 4. REVIEWS TABLE
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='marketplace_reviews' AND xtype='U')
CREATE TABLE marketplace_reviews (
    id INT IDENTITY(1,1) PRIMARY KEY,
    order_id INT NOT NULL,
    reviewer_id INT NOT NULL,
    reviewed_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (order_id) REFERENCES marketplace_orders(id)
);

-- Create indexes for performance
CREATE INDEX idx_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_listings_status ON marketplace_listings(status);
CREATE INDEX idx_bids_listing ON marketplace_bids(listing_id);
CREATE INDEX idx_bids_buyer ON marketplace_bids(buyer_id);
CREATE INDEX idx_orders_seller ON marketplace_orders(seller_id);
CREATE INDEX idx_orders_buyer ON marketplace_orders(buyer_id);
CREATE INDEX idx_orders_status ON marketplace_orders(payment_status, delivery_status);
CREATE INDEX idx_reviews_reviewed ON marketplace_reviews(reviewed_id);

-- Sample Queries

-- Get all active listings
SELECT * FROM marketplace_listings WHERE status = 'active' ORDER BY created_at DESC;

-- Get bids for a specific listing (sorted by price, highest first)
SELECT * FROM marketplace_bids 
WHERE listing_id = 1 
ORDER BY bid_price_per_kg DESC, created_at DESC;

-- Get all orders for a buyer
SELECT * FROM marketplace_orders WHERE buyer_id = 2 ORDER BY created_at DESC;

-- Get seller's average rating
SELECT 
    AVG(CAST(rating AS FLOAT)) as avgRating, 
    COUNT(*) as reviewCount 
FROM marketplace_reviews 
WHERE reviewed_id = 1;

-- Get seller's revenue
SELECT 
    SUM(total_amount) as totalRevenue,
    COUNT(DISTINCT id) as totalOrders,
    AVG(total_amount) as avgOrderValue
FROM marketplace_orders 
WHERE seller_id = 1 AND payment_status = 'released';

-- Get pending deliveries
SELECT * FROM marketplace_orders 
WHERE delivery_status = 'shipped' AND payment_status = 'escrowed'
ORDER BY updated_at ASC;

-- Get seller's recent orders with buyer info
SELECT 
    o.id,
    o.batch_id,
    o.quantity_kg,
    o.price_per_kg,
    o.total_amount,
    o.delivery_status,
    o.payment_status,
    b.buyer_name,
    b.buyer_email
FROM marketplace_orders o
JOIN marketplace_bids b ON o.bid_id = b.id
WHERE o.seller_id = 1
ORDER BY o.created_at DESC;

-- Get buyer's orders with seller info
SELECT 
    o.id,
    o.batch_id,
    l.crop_name,
    o.quantity_kg,
    o.price_per_kg,
    o.total_amount,
    o.delivery_status,
    o.payment_status,
    l.seller_name,
    l.seller_email
FROM marketplace_orders o
JOIN marketplace_listings l ON o.listing_id = l.id
WHERE o.buyer_id = 2
ORDER BY o.created_at DESC;
