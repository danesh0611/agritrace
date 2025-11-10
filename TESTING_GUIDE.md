# Farmer Approval System - Testing Guide

## Setup Required

1. **Backend Running**: `npm start` in `agri_backend` folder
2. **Frontend Running**: `npm run dev` in `agri_ui` folder  
3. **MetaMask Connected**: To localhost or test network

## Quick Test (5 minutes)

### Step 1: Create Test Accounts

**Distributor Account:**
- Go to http://localhost:5173/signup
- Username: `TestDistributor`
- Email: `dist@test.com`
- Password: `Test123`
- Role: **distributor**
- Click "Sign Up"

**Farmer Account:**
- Go to http://localhost:5173/signup
- Username: `TestFarmer`
- Email: `farmer@test.com`
- Password: `Test123`
- Role: **farmer**
- Click "Sign Up"

### Step 2: Distributor Submits Batch

1. Login as distributor (`dist@test.com`)
2. On dashboard, scroll down to **"Submit Batch for Farmer Approval"** form
3. Fill in:
   - **Batch ID**: `BATCH-001`
   - **Crop Name**: `Wheat`
   - **Farmer Email**: `farmer@test.com` ← **IMPORTANT**
   - **Distributor Name**: `Green Farms Inc`
   - **Quantity Received**: `500`
   - **Purchase Price**: `25000`
   - **Transport Details**: `Truck TN-001 via Highway`
   - **Warehouse Location**: `Chennai WH`
   - **Handover Date**: Tomorrow's date
4. Click **"Submit to Farmer for Approval"**
5. Approve in MetaMask
6. Should see: `"Submission sent to farmer for approval. Waiting for farmer to approve..."`

### Step 3: Farmer Sees Pending Approval

1. In new window, login as farmer (`farmer@test.com`)
2. On dashboard, look for **"Pending Approvals"** section
3. Should see the batch submitted by distributor with all details:
   - Batch ID: `BATCH-001`
   - Crop: `Wheat`
   - Distributor: `Green Farms Inc`
   - Quantity: `500 kg`
   - Price: `₹25000`
   - Warehouse: `Chennai WH`

### Step 4: Farmer Approves (Links Both Chains)

1. Click **"Approve & Link Chains"** button
2. Approve in MetaMask wallet
3. Wait for transaction to complete
4. Should see: `"Batch 'BATCH-001' approved! Both chains are now linked."`
5. Pending approval disappears from list

### Step 5: Verify Database

Open SQL Server Management Studio:
```sql
USE regdetails;
SELECT * FROM farmer_approvals WHERE batch_id = 'BATCH-001';
```

**Expected Result:**
- `batch_id`: BATCH-001
- `distributor_tx_hash`: 0x... (from step 2)
- `farmer_tx_hash`: 0x... (from step 4)
- `status`: approved
- `distributor_name`: Green Farms Inc
- `farmer_email`: farmer@test.com

## Test Case: Farmer Rejects

1. Distributor submits another batch (different BATCH ID)
2. Farmer sees it in pending
3. Click **"Reject"** button (instead of approve)
4. Batch disappears from pending list
5. In database, status should be `rejected`

## Expected Messages

| Action | Expected Message |
|--------|------------------|
| Distributor submits | "Submission sent to farmer (farmer@test.com) for approval..." |
| Farmer opens dashboard | Pending Approvals section appears with count of batches |
| Farmer approves | "Batch 'BATCH-001' approved! Both chains are now linked." |
| Farmer rejects | "Batch 'BATCH-001' rejected." |
| No pending approvals | "No pending approvals" with checkmark |

## Troubleshooting

**Issue**: Pending Approvals not showing for farmer
- ✅ Make sure farmer email matches exactly (case-sensitive in some cases)
- ✅ Check console for errors: Press F12 → Console tab
- ✅ Verify backend is running: http://localhost:5000 should show API message

**Issue**: "Submit to Farmer for Approval" button disabled
- ✅ Fill all form fields
- ✅ Make sure MetaMask is connected and on correct network
- ✅ Check wallet has ETH for gas

**Issue**: Approval button shows "Approving..." but doesn't complete
- ✅ Check MetaMask - might be waiting for confirmation
- ✅ Check console for errors
- ✅ Verify network connection

**Issue**: "Farmer Email" field not showing in form
- ✅ Clear browser cache: Ctrl+Shift+Delete
- ✅ Hard refresh: Ctrl+Shift+R
- ✅ Check if you're logged in as distributor (role must be "distributor")

## Database Verification Commands

```sql
-- Check all pending approvals
SELECT batch_id, distributor_name, farmer_email, status 
FROM farmer_approvals 
WHERE status = 'pending';

-- Check all approved batches
SELECT batch_id, distributor_tx_hash, farmer_tx_hash, status 
FROM farmer_approvals 
WHERE status = 'approved';

-- Check specific batch linking
SELECT batch_id, distributor_id, farmer_email, 
       distributor_tx_hash, farmer_tx_hash, status 
FROM farmer_approvals 
WHERE batch_id = 'BATCH-001';

-- Count by status
SELECT status, COUNT(*) as count 
FROM farmer_approvals 
GROUP BY status;
```

## Full Workflow Test (15 minutes)

1. **Create 2 distributors + 2 farmers** (combinations)
2. **Each distributor submits 2 different batches** (4 total submissions)
3. **First farmer approves 2 batches** (one from each distributor)
4. **Second farmer rejects 1, approves 1**
5. **Verify database has:**
   - 2 approved batches (both TXs linked)
   - 1 rejected batch
   - 1 still pending (if any)

## Performance Notes

- Dashboard polls every 5 seconds for new pending approvals
- Initial load of pending approvals: ~1-2 seconds
- Approval transaction: ~15-30 seconds (depends on network)
- Database can handle 1000+ pending approvals per farmer

## Next Steps After Testing

1. Deploy backend to Azure/production
2. Update API URLs from `localhost:5000` to production URL
3. Test with real MetaMask accounts
4. Set up database backups
5. Monitor approval completion rates
