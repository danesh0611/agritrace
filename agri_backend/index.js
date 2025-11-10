
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
const config = {
  server: process.env.DB_SERVER || 'ledgerlegends.database.windows.net',
  user: process.env.DB_USER || 'ledgerlegends',
  password: process.env.DB_PASSWORD || 'Chakra*2006',
  database: process.env.DB_NAME || 'regdetails',
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
