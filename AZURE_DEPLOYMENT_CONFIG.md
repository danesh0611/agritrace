# ✅ Fixed: Azure Deployment Configuration

## Problem
When deployed to Azure, frontend was getting `net::ERR_CONNECTION_REFUSED` because it was trying to connect to `localhost:5000` instead of the Azure backend.

## Root Cause
All API calls were hardcoded to `http://localhost:5000`:
- DistributorForm.jsx
- FarmerApprovals.jsx
- ApprovedBatches.jsx

`localhost` only works on your local machine. When deployed, it needs to use the actual backend URL.

## Solution Applied

### 1. Updated `api.js` with Environment Detection
```javascript
// Automatically detect environment
export const API_BASE_URL = 
	import.meta.env.MODE === 'development' 
		? 'http://localhost:5000'                    // Development: localhost
		: 'https://agri-backend-2025-dxfkavfcamg0ebby.southindia-01.azurewebsites.net'; // Production: Azure
```

This way:
- ✅ **Local development**: Uses `localhost:5000`
- ✅ **Deployed to Azure**: Uses Azure backend URL automatically

### 2. Updated All Components to Use `API_BASE_URL`

**Files updated:**
- ✅ `DistributorForm.jsx` - Import API_BASE_URL, replace all `localhost:5000` URLs
- ✅ `FarmerApprovals.jsx` - Import API_BASE_URL, replace all `localhost:5000` URLs  
- ✅ `ApprovedBatches.jsx` - Import API_BASE_URL, replace all `localhost:5000` URLs

**Before:**
```javascript
fetch('http://localhost:5000/api/approvals/submit', ...)
```

**After:**
```javascript
fetch(`${API_BASE_URL}/api/approvals/submit`, ...)
```

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│               Frontend (Vercel Deployment)              │
│  - Detects environment: development vs production       │
│  - Uses API_BASE_URL from api.js                       │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
    DEVELOPMENT              PRODUCTION (Azure)
        │                             │
        ▼                             ▼
┌──────────────────┐    ┌─────────────────────────────────┐
│ localhost:5000   │    │ Azure Web App Backend           │
│ (Local Dev)      │    │ agri-backend-2025-...           │
└──────────────────┘    │ (Production)                    │
                        └─────────────────────────────────┘
```

---

## How It Works

### When Running Locally (`npm run dev`)
```
import.meta.env.MODE = 'development'
  ↓
API_BASE_URL = 'http://localhost:5000'
  ↓
All API calls go to localhost ✅
```

### When Deployed to Azure
```
import.meta.env.MODE = 'production'
  ↓
API_BASE_URL = 'https://agri-backend-2025-dxfkavfcamg0ebby.southindia-01.azurewebsites.net'
  ↓
All API calls go to Azure backend ✅
```

---

## Files Modified

1. **`agri_ui/src/lib/api.js`**
   - Added environment detection logic
   - Kept the centralized BASE_URL pattern

2. **`agri_ui/src/components/BlockchainForms/DistributorForm.jsx`**
   - Import `API_BASE_URL`
   - Changed: `fetch('http://localhost:5000/api/approvals/submit', ...)`
   - To: `fetch(\`${API_BASE_URL}/api/approvals/submit\`, ...)`

3. **`agri_ui/src/components/FarmerApprovals.jsx`**
   - Import `API_BASE_URL`
   - Updated 3 fetch calls (pending, approve, reject)

4. **`agri_ui/src/components/ApprovedBatches.jsx`**
   - Import `API_BASE_URL`
   - Updated 2 fetch calls (pending-blockchain, blockchain-confirm)

---

## Verification

### Development Environment Check
```bash
# Run locally - should work with localhost
npm run dev
# Browser console should show: All API calls going to http://localhost:5000
```

### Production Environment Check
```bash
# After deploying to Vercel/Azure
# Browser console should show: All API calls going to Azure backend URL
```

---

## API Endpoints Configuration

The system automatically uses the correct base URL for all endpoints:

| Endpoint | Dev | Production |
|----------|-----|-----------|
| POST /api/approvals/submit | localhost:5000 | Azure backend |
| GET /api/approvals/pending/:email | localhost:5000 | Azure backend |
| POST /api/approvals/:id/approve | localhost:5000 | Azure backend |
| POST /api/approvals/:id/reject | localhost:5000 | Azure backend |
| GET /api/approvals/pending-blockchain/:id | localhost:5000 | Azure backend |
| POST /api/approvals/:id/blockchain-confirm | localhost:5000 | Azure backend |

---

## Benefits

✅ **Single source of truth** - API_BASE_URL in one place
✅ **Environment-aware** - Automatically switches between dev and prod
✅ **No hardcoding** - No need to manually change URLs
✅ **Easy maintenance** - Just update api.js if Azure URL changes
✅ **Scalable** - Can add more environments if needed

---

## Testing the Fix

### Test Locally
1. Run `npm run dev` in agri_ui
2. Open browser DevTools (F12) → Network tab
3. Submit a batch
4. Verify requests go to `http://localhost:5000` ✅

### Test on Azure
1. Deploy frontend to Vercel/Azure
2. Open browser DevTools → Network tab
3. Submit a batch
4. Verify requests go to `https://agri-backend-2025-...` ✅

---

## If Backend URL Changes

Simply update one file:
```javascript
// agri_ui/src/lib/api.js
export const API_BASE_URL = 
	import.meta.env.MODE === 'development' 
		? 'http://localhost:5000'
		: 'https://NEW-AZURE-URL-HERE'; // Change only here
```

All components automatically use the new URL! 🎯

---

## Status

✅ **Frontend**: Configured for Azure deployment
✅ **Environment Detection**: Automatic dev/prod switching
✅ **All Components**: Updated to use centralized API_BASE_URL
✅ **Ready for Deployment**: No more localhost hardcoding

The system is now production-ready and will work correctly on both local development and Azure deployment!
