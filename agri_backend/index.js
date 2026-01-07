
import express from 'express';
import sql from 'mssql';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://agri-trace-mu.vercel.app',
    'https://agri-ui.vercel.app'
  ],
  credentials: true
}));
app.use(bodyParser.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Agriculture Backend API is running!', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', database: 'Not tested yet' });
});

// SQL Server connection configuration
console.log('Environment DB_SERVER:', process.env.DB_SERVER);
console.log('Using server:', process.env.DB_SERVER || 'ledgerlegends.database.windows.net');

const config = {
  server: process.env.DB_SERVER || 'ledgerlegends.database.windows.net',
  user: process.env.DB_USER || 'ledgerlegends',
  password: process.env.DB_PASSWORD || 'Chakra*2006',
  database: process.env.DB_NAME || 'reg_details',
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Global connection pool
let pool = null;

// Initialize connection pool
async function initializePool() {
  try {
    console.log('Initializing SQL Server connection pool...');
    pool = await sql.connect(config);
    console.log('Connected to SQL Server successfully');

    // Create tables if not exists
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='users' AND xtype='U')
      CREATE TABLE users (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL,
        password NVARCHAR(255) NOT NULL,
        role NVARCHAR(50) NOT NULL CHECK (role IN ('farmer', 'distributor', 'retailer')),
        created_at DATETIME DEFAULT GETDATE()
      )
    `);
    console.log('Users table ready');

    // Create farmer_approvals table for pending distributor submissions
    // Drop old table if it exists (to ensure schema is correct)
    await pool.request().query(`
      IF EXISTS (SELECT * FROM sysobjects WHERE name='farmer_approvals' AND xtype='U')
      DROP TABLE farmer_approvals
    `);

    // Create fresh table with correct schema
    await pool.request().query(`
      CREATE TABLE farmer_approvals (
        id INT IDENTITY(1,1) PRIMARY KEY,
        batch_id NVARCHAR(255) NOT NULL,
        crop_name NVARCHAR(255) NOT NULL,
        distributor_id INT NOT NULL,
        distributor_name NVARCHAR(255) NOT NULL,
        quantity_received FLOAT NOT NULL,
        purchase_price FLOAT NOT NULL,
        transport_details NVARCHAR(MAX) NOT NULL,
        warehouse_location NVARCHAR(255) NOT NULL,
        handover_date BIGINT NOT NULL,
        farmer_email NVARCHAR(255) NOT NULL,
        status NVARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        distributor_tx_hash NVARCHAR(MAX),
        farmer_tx_hash NVARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE()
      )
    `);

    console.log('✓ Farmer approvals table created (fresh schema)');

    // Create marketplace_listings table (farmers selling their produce)
    await pool.request().query(`
      IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='marketplace_listings' AND xtype='U')
      CREATE TABLE marketplace_listings (
        id INT IDENTITY(1,1) PRIMARY KEY,
        batch_id NVARCHAR(255) NOT NULL,
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
      )
    `);
    console.log('✓ Marketplace listings table created');

    // Create marketplace_bids table (buyers placing bids)
    await pool.request().query(`
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
      )
    `);
    console.log('✓ Marketplace bids table created');

    // Create marketplace_orders table (accepted bids become orders)
    await pool.request().query(`
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
      )
    `);
    console.log('✓ Marketplace orders table created');

    // Create marketplace_reviews table (buyers review sellers)
    await pool.request().query(`
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
      )
    `);
    console.log('✓ Marketplace reviews table created');

    return true;
  } catch (err) {
    console.error('SQL Server connection error:', err);
    pool = null;
    return false;
  }
}

// Initialize on startup and start server only after connection is ready
async function startServer() {
  console.log('Starting server initialization...');
  const connected = await initializePool();

  if (!connected) {
    console.error('Failed to connect to database. Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
    return;
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

// Start the server
startServer();

// Registration endpoint
app.post('/api/register', async (req, res) => {
  const { username, email, password, role } = req.body;
  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate role
  const validRoles = ['farmer', 'distributor', 'retailer'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  try {
    if (!pool) {
      throw new Error('Database not connected');
    }

    // First check if email already exists
    const checkRequest = pool.request();
    checkRequest.input('email', sql.NVarChar, email);
    const existingUser = await checkRequest.query('SELECT id FROM users WHERE email = @email');

    if (existingUser.recordset.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // If email doesn't exist, proceed with registration
    const request = pool.request();
    request.input('username', sql.NVarChar, username);
    request.input('email', sql.NVarChar, email);
    request.input('password', sql.NVarChar, password);
    request.input('role', sql.NVarChar, role);

    const result = await request.query('INSERT INTO users (username, email, password, role) VALUES (@username, @email, @password, @role)');
    res.json({ success: true, userId: result.rowsAffected[0] });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    if (!pool) {
      throw new Error('Database not connected');
    }

    const request = pool.request();
    request.input('email', sql.NVarChar, email);
    request.input('password', sql.NVarChar, password);

    const result = await request.query('SELECT * FROM users WHERE email = @email AND password = @password');

    if (result.recordset.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Optionally, do not send password back
    const user = { ...result.recordset[0] };
    delete user.password;
    res.json({ success: true, user });
  } catch (err) {
    console.error('Login query error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Endpoint: Distributor submits transaction for farmer approval
app.post('/api/approvals/submit', async (req, res) => {
  const {
    batchId,
    cropName,
    distributorId,
    distributorName,
    quantityReceived,
    purchasePrice,
    transportDetails,
    warehouseLocation,
    handoverDate,
    farmerEmail,
    distributorTxHash
  } = req.body;

  console.log('Approval submission received:', {
    batchId,
    cropName,
    distributorId,
    distributorName,
    quantityReceived,
    purchasePrice,
    transportDetails,
    warehouseLocation,
    handoverDate,
    farmerEmail,
    distributorTxHash
  });

  if (!batchId || !cropName || !distributorId || !farmerEmail) {
    const missingFields = [];
    if (!batchId) missingFields.push('batchId');
    if (!cropName) missingFields.push('cropName');
    if (!distributorId) missingFields.push('distributorId');
    if (!farmerEmail) missingFields.push('farmerEmail');
    console.error('Missing required fields:', missingFields);
    return res.status(400).json({
      error: 'Missing required fields',
      missingFields,
      receivedData: req.body
    });
  }

  try {
    if (!pool) {
      throw new Error('Database not connected');
    }

    const request = pool.request();
    request.input('batch_id', sql.NVarChar, batchId);
    request.input('crop_name', sql.NVarChar, cropName);
    request.input('distributor_id', sql.Int, distributorId);
    request.input('distributor_name', sql.NVarChar, distributorName);
    request.input('quantity_received', sql.Float, parseFloat(quantityReceived));
    request.input('purchase_price', sql.Float, parseFloat(purchasePrice));
    request.input('transport_details', sql.NVarChar, transportDetails);
    request.input('warehouse_location', sql.NVarChar, warehouseLocation);
    request.input('handover_date', sql.BigInt, handoverDate);
    request.input('farmer_email', sql.NVarChar, farmerEmail);
    request.input('distributor_tx_hash', sql.NVarChar, distributorTxHash || null);

    const result = await request.query(`
      INSERT INTO farmer_approvals 
      (batch_id, crop_name, distributor_id, distributor_name, quantity_received, purchase_price, 
       transport_details, warehouse_location, handover_date, farmer_email, distributor_tx_hash, status)
      VALUES 
      (@batch_id, @crop_name, @distributor_id, @distributor_name, @quantity_received, @purchase_price,
       @transport_details, @warehouse_location, @handover_date, @farmer_email, @distributor_tx_hash, 'pending')
    `);

    res.json({
      success: true,
      message: 'Submission saved. Waiting for farmer approval.',
      approvalId: result.rowsAffected[0]
    });
  } catch (err) {
    console.error('Approval submission error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Endpoint: Get pending approvals for a farmer
app.get('/api/approvals/pending/:farmerEmail', async (req, res) => {
  const { farmerEmail } = req.params;

  try {
    if (!pool) {
      throw new Error('Database not connected');
    }

    const request = pool.request();
    request.input('farmer_email', sql.NVarChar, farmerEmail);

    const result = await request.query(`
      SELECT * FROM farmer_approvals 
      WHERE farmer_email = @farmer_email AND status = 'pending'
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      approvals: result.recordset
    });
  } catch (err) {
    console.error('Error fetching pending approvals:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Endpoint: Get approved batches for a distributor (awaiting blockchain submission)
app.get('/api/approvals/pending-blockchain/:distributorId', async (req, res) => {
  const { distributorId } = req.params;

  try {
    if (!pool) {
      throw new Error('Database not connected');
    }

    const request = pool.request();
    request.input('distributor_id', sql.Int, parseInt(distributorId));

    const result = await request.query(`
      SELECT * FROM farmer_approvals 
      WHERE distributor_id = @distributor_id 
      AND status = 'approved'
      AND (distributor_tx_hash IS NULL OR distributor_tx_hash = '')
      ORDER BY updated_at DESC
    `);

    res.json({
      success: true,
      approvals: result.recordset
    });
  } catch (err) {
    console.error('Error fetching pending blockchain approvals:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Endpoint: Confirm blockchain submission (distributor submits tx hash after approval)
// MUST come before the generic :action endpoint to be matched first!
app.post('/api/approvals/:approvalId/blockchain-confirm', async (req, res) => {
  const { approvalId } = req.params;
  const { distributorTxHash } = req.body;

  try {
    if (!pool) {
      throw new Error('Database not connected');
    }

    const request = pool.request();
    request.input('id', sql.Int, parseInt(approvalId));
    request.input('distributor_tx_hash', sql.NVarChar, distributorTxHash);

    await request.query(`
      UPDATE farmer_approvals 
      SET distributor_tx_hash = @distributor_tx_hash, updated_at = GETDATE()
      WHERE id = @id
    `);

    res.json({
      success: true,
      message: 'Blockchain submission confirmed. Batch is now fully on blockchain and farmer-approved!'
    });
  } catch (err) {
    console.error('Error confirming blockchain submission:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Endpoint: Farmer approves or rejects submission
// This generic endpoint must come AFTER the blockchain-confirm endpoint!
app.post('/api/approvals/:approvalId/:action', async (req, res) => {
  const { approvalId, action } = req.params;
  const { farmerTxHash } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  try {
    if (!pool) {
      throw new Error('Database not connected');
    }

    const newStatus = action === 'approve' ? 'approved' : 'rejected';
    const request = pool.request();
    request.input('id', sql.Int, parseInt(approvalId));
    request.input('status', sql.NVarChar, newStatus);
    request.input('farmer_tx_hash', sql.NVarChar, farmerTxHash || null);

    await request.query(`
      UPDATE farmer_approvals 
      SET status = @status, farmer_tx_hash = @farmer_tx_hash, updated_at = GETDATE()
      WHERE id = @id
    `);

    res.json({
      success: true,
      message: `Approval ${action}ed successfully. Chains are now linked for this batch.`,
      status: newStatus
    });
  } catch (err) {
    console.error('Error updating approval:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Endpoint: Get approved batches for a farmer
app.get('/api/approvals/approved/:farmerEmail', async (req, res) => {
  const { farmerEmail } = req.params;

  try {
    if (!pool) {
      throw new Error('Database not connected');
    }

    const request = pool.request();
    request.input('farmer_email', sql.NVarChar, farmerEmail);

    const result = await request.query(`
      SELECT * FROM farmer_approvals 
      WHERE farmer_email = @farmer_email AND status = 'approved'
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      approvals: result.recordset
    });
  } catch (err) {
    console.error('Error fetching approved approvals:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// ===================== MARKETPLACE API ENDPOINTS =====================

// 1. CREATE LISTING (Farmer lists produce for sale)
app.post('/api/marketplace/listings', async (req, res) => {
  const { batchId, sellerId, sellerEmail, sellerName, cropName, quantityKg, askingPricePerKg, qualityGrade, harvestDate, deliveryLocation } = req.body;

  console.log('Creating listing with data:', {
    batchId, sellerId, sellerEmail, sellerName, cropName, quantityKg, askingPricePerKg
  });

  if (!batchId || !sellerId || !sellerEmail || !cropName || !quantityKg || !askingPricePerKg) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('batch_id', sql.NVarChar, batchId);
    request.input('seller_id', sql.Int, sellerId);
    request.input('seller_email', sql.NVarChar, sellerEmail);
    request.input('seller_name', sql.NVarChar, sellerName);
    request.input('crop_name', sql.NVarChar, cropName);
    request.input('quantity_kg', sql.Float, parseFloat(quantityKg));
    request.input('asking_price_per_kg', sql.Float, parseFloat(askingPricePerKg));
    request.input('quality_grade', sql.NVarChar, qualityGrade || 'Grade-A');
    request.input('harvest_date', sql.DateTime, harvestDate ? new Date(harvestDate) : new Date());
    request.input('delivery_location', sql.NVarChar, deliveryLocation || 'To be determined');

    await request.query(`
      INSERT INTO marketplace_listings (batch_id, seller_id, seller_email, seller_name, crop_name, quantity_kg, asking_price_per_kg, quality_grade, harvest_date, delivery_location)
      VALUES (@batch_id, @seller_id, @seller_email, @seller_name, @crop_name, @quantity_kg, @asking_price_per_kg, @quality_grade, @harvest_date, @delivery_location)
    `);

    console.log('✓ Listing created successfully');
    res.json({ success: true, message: 'Listing created successfully', batchId });
  } catch (err) {
    console.error('❌ Listing creation error:', err.message);
    console.error('Full error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 2. GET ALL LISTINGS (Buyers browse marketplace)
app.get('/api/marketplace/listings', async (req, res) => {
  const { status = 'active' } = req.query;

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('status', sql.NVarChar, status);

    const result = await request.query(`
      SELECT * FROM marketplace_listings 
      WHERE status = @status
      ORDER BY created_at DESC
    `);

    res.json({ success: true, listings: result.recordset });
  } catch (err) {
    console.error('Error fetching listings:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 2a. DELETE LISTING (Farmer removes their listing)
app.delete('/api/marketplace/listings/:listingId', async (req, res) => {
  const { listingId } = req.params;
  const { sellerId } = req.body;

  try {
    if (!pool) throw new Error('Database not connected');

    // Verify the listing belongs to the seller
    const verifyRequest = pool.request();
    verifyRequest.input('id', sql.Int, parseInt(listingId));
    verifyRequest.input('seller_id', sql.Int, parseInt(sellerId));

    const verifyResult = await verifyRequest.query(`
      SELECT * FROM marketplace_listings 
      WHERE id = @id AND seller_id = @seller_id
    `);

    if (verifyResult.recordset.length === 0) {
      return res.status(403).json({ error: 'Unauthorized: This listing does not belong to you' });
    }

    const listing = verifyResult.recordset[0];

    // Check if there are any pending bids (accepted bids are OK - they're converted to orders)
    const checkBidsRequest = pool.request();
    checkBidsRequest.input('listing_id', sql.Int, parseInt(listingId));
    const bidsResult = await checkBidsRequest.query(`
      SELECT COUNT(*) as bidCount FROM marketplace_bids 
      WHERE listing_id = @listing_id AND status = 'pending'
    `);

    const bidCount = bidsResult.recordset[0].bidCount;
    if (bidCount > 0) {
      return res.status(400).json({ error: 'Cannot delete listing with pending bids. Reject all pending bids first.' });
    }

    // Delete in cascade order: orders → bids → listing
    // Step 1: Delete orders that reference bids for this listing
    const deleteOrdersRequest = pool.request();
    deleteOrdersRequest.input('listing_id', sql.Int, parseInt(listingId));
    await deleteOrdersRequest.query(`
      DELETE FROM marketplace_orders 
      WHERE bid_id IN (SELECT id FROM marketplace_bids WHERE listing_id = @listing_id)
    `);

    // Step 2: Delete bids for this listing
    const deleteBidsRequest = pool.request();
    deleteBidsRequest.input('listing_id', sql.Int, parseInt(listingId));
    await deleteBidsRequest.query(`DELETE FROM marketplace_bids WHERE listing_id = @listing_id`);

    // Step 3: Delete the listing
    const deleteRequest = pool.request();
    deleteRequest.input('id', sql.Int, parseInt(listingId));
    await deleteRequest.query(`DELETE FROM marketplace_listings WHERE id = @id`);

    console.log(`✓ Listing ${listingId} deleted by farmer ${sellerId}`);
    res.json({ success: true, message: 'Listing removed successfully' });
  } catch (err) {
    console.error('Error deleting listing:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 3. GET SINGLE LISTING DETAILS
app.get('/api/marketplace/listings/:listingId', async (req, res) => {
  const { listingId } = req.params;

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('id', sql.Int, parseInt(listingId));

    const listing = await request.query(`SELECT * FROM marketplace_listings WHERE id = @id`);
    
    if (listing.recordset.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Get bids for this listing
    const bidsRequest = pool.request();
    bidsRequest.input('listing_id', sql.Int, parseInt(listingId));
    const bids = await bidsRequest.query(`
      SELECT * FROM marketplace_bids 
      WHERE listing_id = @listing_id AND status IN ('pending', 'accepted')
      ORDER BY created_at DESC
    `);

    res.json({ 
      success: true, 
      listing: listing.recordset[0],
      bids: bids.recordset 
    });
  } catch (err) {
    console.error('Error fetching listing details:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 4. PLACE BID (Buyer places offer on listing)
app.post('/api/marketplace/bids', async (req, res) => {
  const { listingId, buyerId, buyerEmail, buyerName, bidQuantityKg, bidPricePerKg } = req.body;

  if (!listingId || !buyerId || !buyerEmail || !bidQuantityKg || !bidPricePerKg) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    if (!pool) throw new Error('Database not connected');

    const totalBidAmount = parseFloat(bidQuantityKg) * parseFloat(bidPricePerKg);

    const request = pool.request();
    request.input('listing_id', sql.Int, listingId);
    request.input('buyer_id', sql.Int, buyerId);
    request.input('buyer_email', sql.NVarChar, buyerEmail);
    request.input('buyer_name', sql.NVarChar, buyerName);
    request.input('bid_quantity_kg', sql.Float, parseFloat(bidQuantityKg));
    request.input('bid_price_per_kg', sql.Float, parseFloat(bidPricePerKg));
    request.input('total_bid_amount', sql.Float, totalBidAmount);

    const result = await request.query(`
      INSERT INTO marketplace_bids (listing_id, buyer_id, buyer_email, buyer_name, bid_quantity_kg, bid_price_per_kg, total_bid_amount)
      VALUES (@listing_id, @buyer_id, @buyer_email, @buyer_name, @bid_quantity_kg, @bid_price_per_kg, @total_bid_amount)
      SELECT SCOPE_IDENTITY() as bidId
    `);

    const bidId = result.recordset[0].bidId;

    res.json({ success: true, message: 'Bid placed successfully', bidId, totalBidAmount });
  } catch (err) {
    console.error('Bid placement error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 5. GET BIDS FOR LISTING (Seller sees all bids)
app.get('/api/marketplace/listings/:listingId/bids', async (req, res) => {
  const { listingId } = req.params;

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('listing_id', sql.Int, parseInt(listingId));

    const result = await request.query(`
      SELECT * FROM marketplace_bids 
      WHERE listing_id = @listing_id
      ORDER BY bid_price_per_kg DESC, created_at DESC
    `);

    res.json({ success: true, bids: result.recordset });
  } catch (err) {
    console.error('Error fetching bids:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 6. ACCEPT BID (Seller accepts a bid, creates order)
app.post('/api/marketplace/bids/:bidId/accept', async (req, res) => {
  const { bidId } = req.params;
  const { txHash } = req.body;

  try {
    if (!pool) throw new Error('Database not connected');

    // Get bid details
    const bidRequest = pool.request();
    bidRequest.input('id', sql.Int, parseInt(bidId));
    const bidResult = await bidRequest.query(`SELECT * FROM marketplace_bids WHERE id = @id`);

    if (bidResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Bid not found' });
    }

    const bid = bidResult.recordset[0];

    // Get listing details (for batch_id and seller_id)
    const listingRequest = pool.request();
    listingRequest.input('id', sql.Int, bid.listing_id);
    const listingResult = await listingRequest.query(`SELECT * FROM marketplace_listings WHERE id = @id`);
    const listing = listingResult.recordset[0];

    // Create order
    const orderRequest = pool.request();
    orderRequest.input('bid_id', sql.Int, bid.id);
    orderRequest.input('listing_id', sql.Int, bid.listing_id);
    orderRequest.input('batch_id', sql.NVarChar, listing.batch_id);
    orderRequest.input('seller_id', sql.Int, listing.seller_id);
    orderRequest.input('buyer_id', sql.Int, bid.buyer_id);
    orderRequest.input('quantity_kg', sql.Float, bid.bid_quantity_kg);
    orderRequest.input('price_per_kg', sql.Float, bid.bid_price_per_kg);
    orderRequest.input('total_amount', sql.Float, bid.total_bid_amount);
    orderRequest.input('tx_hash', sql.NVarChar, txHash || null);

    const orderResult = await orderRequest.query(`
      INSERT INTO marketplace_orders (bid_id, listing_id, batch_id, seller_id, buyer_id, quantity_kg, price_per_kg, total_amount, payment_status, tx_hash)
      VALUES (@bid_id, @listing_id, @batch_id, @seller_id, @buyer_id, @quantity_kg, @price_per_kg, @total_amount, 'escrowed', @tx_hash)
      SELECT SCOPE_IDENTITY() as orderId
    `);

    const orderId = orderResult.recordset[0].orderId;

    // Update bid status
    const updateBidRequest = pool.request();
    updateBidRequest.input('id', sql.Int, bid.id);
    await updateBidRequest.query(`UPDATE marketplace_bids SET status = 'accepted' WHERE id = @id`);

    // Reject all other bids for this listing
    const rejectRequest = pool.request();
    rejectRequest.input('listing_id', sql.Int, bid.listing_id);
    rejectRequest.input('bid_id', sql.Int, bid.id);
    await rejectRequest.query(`
      UPDATE marketplace_bids SET status = 'rejected' WHERE listing_id = @listing_id AND id != @bid_id AND status = 'pending'
    `);

    res.json({ success: true, message: 'Bid accepted, order created', orderId });
  } catch (err) {
    console.error('Error accepting bid:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 7. GET BUYER ORDERS
app.get('/api/marketplace/orders/buyer/:buyerId', async (req, res) => {
  const { buyerId } = req.params;

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('buyer_id', sql.Int, parseInt(buyerId));

    const result = await request.query(`
      SELECT * FROM marketplace_orders 
      WHERE buyer_id = @buyer_id
      ORDER BY created_at DESC
    `);

    res.json({ success: true, orders: result.recordset });
  } catch (err) {
    console.error('Error fetching buyer orders:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 8. GET SELLER ORDERS
app.get('/api/marketplace/orders/seller/:sellerId', async (req, res) => {
  const { sellerId } = req.params;

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('seller_id', sql.Int, parseInt(sellerId));

    const result = await request.query(`
      SELECT * FROM marketplace_orders 
      WHERE seller_id = @seller_id
      ORDER BY created_at DESC
    `);

    res.json({ success: true, orders: result.recordset });
  } catch (err) {
    console.error('Error fetching seller orders:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Get all orders for a specific batch (blockchain tracking)
app.get('/api/marketplace/batch-orders', async (req, res) => {
  const { batchId } = req.query;

  if (!batchId) {
    return res.status(400).json({ error: 'batchId query parameter required' });
  }

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('batch_id', sql.NVarChar, batchId);

    const result = await request.query(`
      SELECT o.*, 
             r.rating as review_rating, 
             r.comment as review_comment
      FROM marketplace_orders o
      LEFT JOIN marketplace_reviews r ON o.id = r.order_id
      WHERE o.batch_id = @batch_id
      ORDER BY o.created_at DESC
    `);

    res.json({ success: true, orders: result.recordset });
  } catch (err) {
    console.error('Error fetching batch orders:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 9. CONFIRM DELIVERY (Seller marks as shipped, buyer marks as delivered)
app.post('/api/marketplace/orders/:orderId/delivery', async (req, res) => {
  const { orderId } = req.params;
  const { status } = req.body; // 'shipped' or 'delivered'

  if (!['shipped', 'delivered'].includes(status)) {
    return res.status(400).json({ error: 'Invalid delivery status' });
  }

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('id', sql.Int, parseInt(orderId));
    request.input('delivery_status', sql.NVarChar, status);

    await request.query(`
      UPDATE marketplace_orders 
      SET delivery_status = @delivery_status, updated_at = GETDATE()
      WHERE id = @id
    `);

    // If delivered, update payment status to 'released'
    if (status === 'delivered') {
      const paymentRequest = pool.request();
      paymentRequest.input('id', sql.Int, parseInt(orderId));
      await paymentRequest.query(`
        UPDATE marketplace_orders 
        SET payment_status = 'released', updated_at = GETDATE()
        WHERE id = @id
      `);
    }

    res.json({ success: true, message: 'Delivery status updated' });
  } catch (err) {
    console.error('Error updating delivery:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// Mark order as mined/submitted to approval form (will be hidden from marketplace)
app.post('/api/marketplace/orders/:orderId/submit-to-approval', async (req, res) => {
  const { orderId } = req.params;

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('id', sql.Int, parseInt(orderId));

    await request.query(`
      UPDATE marketplace_orders 
      SET payment_status = 'submitted_for_approval', updated_at = GETDATE()
      WHERE id = @id
    `);

    res.json({ success: true, message: 'Order submitted to approval. It will be removed from marketplace.' });
  } catch (err) {
    console.error('Error submitting order to approval:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 10. SUBMIT REVIEW (Buyer reviews seller after delivery)
app.post('/api/marketplace/reviews', async (req, res) => {
  const { orderId, reviewerId, reviewedId, rating, comment } = req.body;

  if (!orderId || !reviewerId || !reviewedId || !rating) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 1 and 5' });
  }

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('order_id', sql.Int, parseInt(orderId));
    request.input('reviewer_id', sql.Int, parseInt(reviewerId));
    request.input('reviewed_id', sql.Int, parseInt(reviewedId));
    request.input('rating', sql.Int, parseInt(rating));
    request.input('comment', sql.NVarChar, comment || '');

    await request.query(`
      INSERT INTO marketplace_reviews (order_id, reviewer_id, reviewed_id, rating, comment)
      VALUES (@order_id, @reviewer_id, @reviewed_id, @rating, @comment)
    `);

    res.json({ success: true, message: 'Review submitted successfully' });
  } catch (err) {
    console.error('Error submitting review:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 11. GET SELLER RATINGS
app.get('/api/marketplace/sellers/:sellerId/ratings', async (req, res) => {
  const { sellerId } = req.params;

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('reviewed_id', sql.Int, parseInt(sellerId));

    const result = await request.query(`
      SELECT AVG(CAST(rating AS FLOAT)) as avgRating, COUNT(*) as reviewCount 
      FROM marketplace_reviews 
      WHERE reviewed_id = @reviewed_id
    `);

    const stats = result.recordset[0];

    res.json({ 
      success: true, 
      avgRating: stats.avgRating || 0,
      reviewCount: stats.reviewCount || 0
    });
  } catch (err) {
    console.error('Error fetching ratings:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

// 12. CONFIRM ESCROW DEPOSIT (Update order with blockchain TX)
app.post('/api/marketplace/orders/:orderId/confirm-escrow', async (req, res) => {
  const { orderId } = req.params;
  const { txHash } = req.body;

  try {
    if (!pool) throw new Error('Database not connected');

    const request = pool.request();
    request.input('id', sql.Int, parseInt(orderId));
    request.input('tx_hash', sql.NVarChar, txHash);

    await request.query(`
      UPDATE marketplace_orders 
      SET tx_hash = @tx_hash, payment_status = 'escrowed', updated_at = GETDATE()
      WHERE id = @id
    `);

    res.json({
      success: true,
      message: 'Escrow deposit confirmed. Funds are now secured.'
    });
  } catch (err) {
    console.error('Error confirming escrow:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});
