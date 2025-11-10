# API Documentation - Farmer Approval System

## Base URL
```
Local Development: http://localhost:5000
Production: https://your-backend-domain.com
```

---

## 1. POST `/api/approvals/submit`

### Description
Distributor submits a batch for farmer approval. Stores in database and waits for farmer to approve.

### Request

**Method:** `POST`

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "batchId": "BATCH-001",
  "cropName": "Wheat",
  "distributorId": 123,
  "distributorName": "Green Farms Inc",
  "quantityReceived": 500,
  "purchasePrice": 25000,
  "transportDetails": "Truck TN-001 via NH44",
  "warehouseLocation": "Chennai WH",
  "handoverDate": 1699603200,
  "farmerEmail": "farmer@test.com",
  "distributorTxHash": "0xabc1234567890def"
}
```

**Field Descriptions:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| batchId | string | ✅ | Unique batch identifier |
| cropName | string | ✅ | Name of crop |
| distributorId | number | ✅ | Distributor's user ID from database |
| distributorName | string | ✅ | Distributor company name |
| quantityReceived | number | ✅ | Quantity in kg |
| purchasePrice | number | ✅ | Price in rupees |
| transportDetails | string | ✅ | Transport/logistics info |
| warehouseLocation | string | ✅ | Warehouse location |
| handoverDate | number | ✅ | Unix timestamp |
| farmerEmail | string | ✅ | Email of farmer who will approve |
| distributorTxHash | string | ⭕ | Blockchain TX hash from distributor |

### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Submission saved. Waiting for farmer approval.",
  "approvalId": 42
}
```

**Error (400):**
```json
{
  "error": "Missing required fields"
}
```

**Error (500):**
```json
{
  "error": "Database error",
  "details": "Connection timeout"
}
```

### Example Request (JavaScript)

```javascript
const submitForApproval = async (batchData) => {
  const response = await fetch('http://localhost:5000/api/approvals/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      batchId: batchData.batchId,
      cropName: batchData.cropName,
      distributorId: user.id,
      distributorName: batchData.distributorName,
      quantityReceived: parseFloat(batchData.quantityReceived),
      purchasePrice: parseFloat(batchData.purchasePrice),
      transportDetails: batchData.transportDetails,
      warehouseLocation: batchData.warehouseLocation,
      handoverDate: Math.floor(new Date(batchData.handoverDate).getTime() / 1000),
      farmerEmail: batchData.farmerEmail,
      distributorTxHash: txHash
    })
  });
  
  const data = await response.json();
  return data;
};
```

---

## 2. GET `/api/approvals/pending/:farmerEmail`

### Description
Get all pending approvals (waiting for farmer action) for a specific farmer.

### Request

**Method:** `GET`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| farmerEmail | string | ✅ | Email of the farmer |

**Example URL:**
```
GET /api/approvals/pending/farmer@test.com
```

### Response

**Success (200):**
```json
{
  "success": true,
  "approvals": [
    {
      "id": 1,
      "batch_id": "BATCH-001",
      "crop_name": "Wheat",
      "distributor_id": 123,
      "distributor_name": "Green Farms Inc",
      "quantity_received": 500,
      "purchase_price": 25000,
      "transport_details": "Truck TN-001",
      "warehouse_location": "Chennai WH",
      "handover_date": 1699603200,
      "farmer_email": "farmer@test.com",
      "status": "pending",
      "distributor_tx_hash": "0xabc1234567890def",
      "farmer_tx_hash": null,
      "created_at": "2024-11-10T10:30:00.000Z",
      "updated_at": "2024-11-10T10:30:00.000Z"
    },
    {
      "id": 2,
      "batch_id": "BATCH-002",
      "crop_name": "Rice",
      "distributor_id": 124,
      "distributor_name": "Harvest Co",
      "quantity_received": 300,
      "purchase_price": 15000,
      "transport_details": "Truck MH-002",
      "warehouse_location": "Bangalore WH",
      "handover_date": 1699689600,
      "farmer_email": "farmer@test.com",
      "status": "pending",
      "distributor_tx_hash": "0xdef4567890123abc",
      "farmer_tx_hash": null,
      "created_at": "2024-11-10T11:00:00.000Z",
      "updated_at": "2024-11-10T11:00:00.000Z"
    }
  ]
}
```

**Empty Response (200):**
```json
{
  "success": true,
  "approvals": []
}
```

**Error (500):**
```json
{
  "error": "Database error",
  "details": "Connection failed"
}
```

### Example Request (JavaScript)

```javascript
const fetchPendingApprovals = async (farmerEmail) => {
  const response = await fetch(
    `http://localhost:5000/api/approvals/pending/${farmerEmail}`
  );
  const data = await response.json();
  
  if (data.success) {
    console.log(`Found ${data.approvals.length} pending approvals`);
    return data.approvals;
  } else {
    console.error('Error fetching approvals:', data.error);
    return [];
  }
};
```

---

## 3. POST `/api/approvals/:approvalId/approve`

### Description
Farmer approves a batch. Links both distributor and farmer blockchain transactions.

### Request

**Method:** `POST`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| approvalId | number | ✅ | ID of the approval to approve |

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "farmerTxHash": "0xdef4567890123abc"
}
```

**Example URL:**
```
POST /api/approvals/1/approve
```

### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Approval approved successfully. Chains are now linked for this batch.",
  "status": "approved"
}
```

**Error (400):**
```json
{
  "error": "Invalid approval ID"
}
```

**Error (500):**
```json
{
  "error": "Database error",
  "details": "Update failed"
}
```

### Example Request (JavaScript)

```javascript
const approveSubmission = async (approvalId, farmerTxHash) => {
  const response = await fetch(
    `http://localhost:5000/api/approvals/${approvalId}/approve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmerTxHash: farmerTxHash })
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Batch approved! Chains linked.');
    return true;
  } else {
    console.error('Approval failed:', data.error);
    return false;
  }
};
```

---

## 4. POST `/api/approvals/:approvalId/reject`

### Description
Farmer rejects a batch. Marks as rejected, doesn't link chains.

### Request

**Method:** `POST`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| approvalId | number | ✅ | ID of the approval to reject |

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "farmerTxHash": null
}
```

**Example URL:**
```
POST /api/approvals/1/reject
```

### Response

**Success (200):**
```json
{
  "success": true,
  "message": "Approval rejected successfully.",
  "status": "rejected"
}
```

**Error (500):**
```json
{
  "error": "Database error"
}
```

### Example Request (JavaScript)

```javascript
const rejectSubmission = async (approvalId) => {
  const response = await fetch(
    `http://localhost:5000/api/approvals/${approvalId}/reject`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ farmerTxHash: null })
    }
  );
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Batch rejected.');
    return true;
  } else {
    console.error('Rejection failed:', data.error);
    return false;
  }
};
```

---

## 5. GET `/api/approvals/approved/:farmerEmail`

### Description
Get all approved batches (chains linked) for a specific farmer.

### Request

**Method:** `GET`

**URL Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| farmerEmail | string | ✅ | Email of the farmer |

**Example URL:**
```
GET /api/approvals/approved/farmer@test.com
```

### Response

**Success (200):**
```json
{
  "success": true,
  "approvals": [
    {
      "id": 1,
      "batch_id": "BATCH-001",
      "crop_name": "Wheat",
      "distributor_name": "Green Farms Inc",
      "quantity_received": 500,
      "purchase_price": 25000,
      "status": "approved",
      "distributor_tx_hash": "0xabc1234567890def",
      "farmer_tx_hash": "0xdef4567890123abc",
      "created_at": "2024-11-10T10:30:00.000Z",
      "updated_at": "2024-11-10T10:45:00.000Z"
    }
  ]
}
```

### Example Request (JavaScript)

```javascript
const fetchApprovedBatches = async (farmerEmail) => {
  const response = await fetch(
    `http://localhost:5000/api/approvals/approved/${farmerEmail}`
  );
  const data = await response.json();
  
  if (data.success) {
    return data.approvals;
  }
  return [];
};
```

---

## Error Handling

### Common Status Codes

| Status | Meaning | Example |
|--------|---------|---------|
| 200 | Success | Approval submitted, batch fetched |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid credentials |
| 409 | Conflict | Email already registered |
| 500 | Server Error | Database connection failed |

### Error Response Format

```json
{
  "error": "Error message",
  "details": "Detailed error info (if available)"
}
```

---

## Rate Limiting

Currently **no rate limiting implemented**. Consider adding for production:

```javascript
// Example: 100 requests per 15 minutes per IP
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

---

## Authentication

Currently **no authentication** on approval endpoints. Add JWT tokens for production:

```javascript
// Example: Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

app.post('/api/approvals/submit', verifyToken, async (req, res) => {
  // ... endpoint logic
});
```

---

## CORS Configuration

Current CORS allows:
```
http://localhost:5173
http://localhost:5174
http://localhost:3000
https://agri-trace-mu.vercel.app
https://agri-ui.vercel.app
```

To add more origins, update `agri_backend/index.js`:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'https://your-domain.com',  // Add new domain here
    'https://api.your-domain.com'
  ],
  credentials: true
}));
```

---

## Database Query Examples

### Get pending approvals for farmer
```sql
SELECT * FROM farmer_approvals
WHERE farmer_email = 'farmer@test.com'
AND status = 'pending'
ORDER BY created_at DESC;
```

### Get approved batches (chains linked)
```sql
SELECT batch_id, distributor_tx_hash, farmer_tx_hash, status
FROM farmer_approvals
WHERE farmer_email = 'farmer@test.com'
AND status = 'approved'
AND distributor_tx_hash IS NOT NULL
AND farmer_tx_hash IS NOT NULL;
```

### Get all submissions by distributor
```sql
SELECT * FROM farmer_approvals
WHERE distributor_id = 123
ORDER BY created_at DESC;
```

### Count approvals by status
```sql
SELECT status, COUNT(*) as count
FROM farmer_approvals
WHERE farmer_email = 'farmer@test.com'
GROUP BY status;
```

---

## Response Time Expectations

| Endpoint | Typical Response Time |
|----------|----------------------|
| POST /api/approvals/submit | 100-200ms |
| GET /api/approvals/pending/:email | 50-150ms |
| POST /api/approvals/:id/approve | 100-200ms |
| POST /api/approvals/:id/reject | 100-200ms |
| GET /api/approvals/approved/:email | 50-150ms |

*Add blockchain transaction time (15-30 seconds) when including smart contract calls*

---

## Testing with cURL

### Submit approval
```bash
curl -X POST http://localhost:5000/api/approvals/submit \
  -H "Content-Type: application/json" \
  -d '{
    "batchId": "BATCH-001",
    "cropName": "Wheat",
    "distributorId": 1,
    "distributorName": "Green Farms",
    "quantityReceived": 500,
    "purchasePrice": 25000,
    "transportDetails": "Truck TN-001",
    "warehouseLocation": "Chennai",
    "handoverDate": 1699603200,
    "farmerEmail": "farmer@test.com",
    "distributorTxHash": "0xabc123"
  }'
```

### Get pending approvals
```bash
curl http://localhost:5000/api/approvals/pending/farmer@test.com
```

### Approve batch
```bash
curl -X POST http://localhost:5000/api/approvals/1/approve \
  -H "Content-Type: application/json" \
  -d '{"farmerTxHash": "0xdef456"}'
```

### Reject batch
```bash
curl -X POST http://localhost:5000/api/approvals/1/reject \
  -H "Content-Type: application/json" \
  -d '{"farmerTxHash": null}'
```

---

## Webhook Integration (Future Enhancement)

Send notifications when approvals happen:

```javascript
// Example: Notify distributor when farmer approves
const notifyDistributor = async (approval) => {
  const payload = {
    event: 'batch_approved',
    batch_id: approval.batch_id,
    distributor_id: approval.distributor_id,
    farmer_email: approval.farmer_email,
    timestamp: new Date().toISOString()
  };
  
  // POST to webhook URL
  await fetch(process.env.WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
};
```

---

## Summary

**3 Main Actions:**
1. 🔄 Submit batch for approval → `/api/approvals/submit`
2. 👀 Check pending approvals → `/api/approvals/pending/:email`
3. ✅ Approve/Reject batch → `/api/approvals/:id/approve` or `reject`

All endpoints return JSON with `success` boolean and appropriate data/error messages.
