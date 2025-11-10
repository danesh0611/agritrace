# Farmer Approval Workflow - Complete Implementation

## Overview
When a distributor adds a batch, it now goes through a farmer approval process before both chains are linked.

## Workflow Steps

### 1. **Distributor Submits Batch**
   - Fills out form with batch details
   - **NEW**: Must specify **Farmer Email** who will approve
   - Submits via "Submit to Farmer for Approval" button
   - Transaction is submitted to blockchain (Distributor's TX hash saved)
   - Data sent to backend for pending approval

### 2. **Farmer Sees Pending Approvals**
   - Logs in to farmer portal
   - **NEW Component**: "Pending Approvals" section appears at top of dashboard
   - Shows all pending batches from distributors awaiting their approval
   - Displays:
     - Batch ID
     - Crop Name
     - Distributor Name
     - Quantity, Price, Warehouse, Transport Details

### 3. **Farmer Approves**
   - Reviews pending batch details
   - Clicks "Approve & Link Chains" button
   - Connects MetaMask wallet if not already connected
   - **NEW**: Submits their own transaction to blockchain via `createProduce()` hook
   - Farmer's TX hash is saved to database
   - Status changes to "approved" in database
   - **Both chains are now linked for that batch ID**

### 4. **Farmer Rejects (Optional)**
   - Can click "Reject" button instead
   - Status changes to "rejected" in database
   - Batch is removed from pending list
   - Distributor knows it was rejected

## Database Schema

### `farmer_approvals` Table
```sql
- id (INT, PRIMARY KEY)
- batch_id (NVARCHAR) - Links both distributor and farmer submissions
- crop_name (NVARCHAR)
- distributor_id (INT)
- distributor_name (NVARCHAR)
- quantity_received (FLOAT)
- purchase_price (FLOAT)
- transport_details (NVARCHAR)
- warehouse_location (NVARCHAR)
- handover_date (BIGINT)
- farmer_email (NVARCHAR) - For routing approvals
- status (NVARCHAR) - 'pending', 'approved', 'rejected'
- distributor_tx_hash (NVARCHAR) - Distributor's blockchain TX
- farmer_tx_hash (NVARCHAR) - Farmer's blockchain TX (on approval)
- created_at (DATETIME)
- updated_at (DATETIME)
```

## API Endpoints

### 1. POST `/api/approvals/submit`
**Distributor submits batch for approval**

Request:
```json
{
  "batchId": "BATCH001",
  "cropName": "Wheat",
  "distributorId": 123,
  "distributorName": "Dist Inc",
  "quantityReceived": 100,
  "purchasePrice": 5000,
  "transportDetails": "Truck XYZ",
  "warehouseLocation": "Warehouse A",
  "handoverDate": 1699603200,
  "farmerEmail": "farmer@email.com",
  "distributorTxHash": "0xabc123..."
}
```

Response:
```json
{
  "success": true,
  "message": "Submission saved. Waiting for farmer approval.",
  "approvalId": 1
}
```

### 2. GET `/api/approvals/pending/:farmerEmail`
**Get all pending approvals for a farmer**

Response:
```json
{
  "success": true,
  "approvals": [
    {
      "id": 1,
      "batch_id": "BATCH001",
      "crop_name": "Wheat",
      "distributor_name": "Dist Inc",
      "quantity_received": 100,
      "purchase_price": 5000,
      "warehouse_location": "Warehouse A",
      "status": "pending",
      ...
    }
  ]
}
```

### 3. POST `/api/approvals/:approvalId/:action`
**Farmer approves or rejects batch**

Request:
```json
{
  "farmerTxHash": "0xdef456..."
}
```

Response:
```json
{
  "success": true,
  "message": "Approval approved successfully. Chains are now linked for this batch.",
  "status": "approved"
}
```

### 4. GET `/api/approvals/approved/:farmerEmail`
**Get all approved batches for a farmer**

## Component Changes

### **DistributorForm.jsx** (Modified)
- Added `farmerEmail` field (required)
- Changed button text to "Submit to Farmer for Approval"
- Now calls `/api/approvals/submit` instead of direct blockchain
- Still submits distributor's blockchain transaction first
- Shows approval message instead of success message

### **FarmerApprovals.jsx** (NEW)
- Displays pending approvals for logged-in farmer
- Polls backend every 5 seconds for new pending approvals
- Shows approve/reject buttons
- On approve:
  - Calls `createProduce()` to submit farmer's blockchain transaction
  - Sends farmer TX hash to `/api/approvals/:id/approve` endpoint
  - Removes from pending list on success
- On reject:
  - Sends to `/api/approvals/:id/reject` endpoint
  - Removes from pending list

### **BlockchainDashboard.jsx** (Updated)
- For farmer role: Now shows FarmerApprovals component first, then FarmerForm
- FarmerApprovals component fetches pending batches automatically

## Key Features

✅ **Distributor**:
- Enters farmer's email before submitting
- Blockchain TX recorded immediately
- Waits for farmer approval

✅ **Farmer**:
- Sees all pending batches awaiting their approval
- Can review batch details
- Approves or rejects with one click
- Only farmer's approval links both chains

✅ **Batch Linking**:
- Once farmer approves: both `distributor_tx_hash` and `farmer_tx_hash` are stored
- Same `batch_id` links both transactions
- Traceability from farmer to distributor complete

✅ **Real-time Updates**:
- Dashboard auto-polls for new pending approvals
- Status updates reflect immediately

## Testing Workflow

1. **Create Distributor Account**
   - Email: distributor@test.com
   - Password: any
   - Role: distributor

2. **Create Farmer Account**
   - Email: farmer@test.com
   - Password: any
   - Role: farmer

3. **Distributor Logs In**
   - Connects MetaMask
   - Fills "Submit Batch for Farmer Approval" form
   - Enters farmer email: farmer@test.com
   - Submits

4. **Farmer Logs In**
   - Sees pending approval in "Pending Approvals" section
   - Reviews details
   - Clicks "Approve & Link Chains"
   - Connects MetaMask if needed
   - Approves in wallet
   - Batch removed from pending (moved to approved)

5. **Verify in Database**
   ```sql
   SELECT * FROM farmer_approvals WHERE batch_id = 'BATCH001'
   -- Should show both distributor_tx_hash and farmer_tx_hash
   -- Status should be 'approved'
   ```

## Error Handling

- If distributor doesn't specify farmer email: form validation fails
- If farmer email doesn't exist: submission still goes through (backend stores it)
- If farmer rejects: batch marked as rejected, can be resubmitted later
- If wallet not connected: prompts to connect before submitting
- Network errors: appropriate error messages shown

## Security Notes

- Farmer email verified at form submission time
- Blockchain transactions immutable
- Only farmer with that email can approve
- Transaction hashes provide audit trail
