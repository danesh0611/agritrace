# Farmer Listing Removal Feature

## Overview
Farmers can now remove their listings from the marketplace. This feature includes:
- Delete button on listing cards in "My Listings" tab
- Confirmation dialog before deletion
- Validation to prevent deletion of listings with active bids
- Backend endpoint with security checks

## Changes Made

### Backend (`agri_backend/index.js`)

**New Endpoint: `DELETE /api/marketplace/listings/:listingId`**

Features:
- ✅ Verifies seller ownership (only listing owner can delete)
- ✅ Checks for active bids - prevents deletion if bids exist
- ✅ Returns meaningful error messages
- ✅ Logs deletion events

Request:
```json
{
  "sellerId": 1
}
```

Response (Success):
```json
{
  "success": true,
  "message": "Listing removed successfully"
}
```

Response (Error - Active Bids):
```json
{
  "error": "Cannot delete listing with active bids. Reject all bids first."
}
```

Response (Error - Not Owner):
```json
{
  "error": "Unauthorized: This listing does not belong to you"
}
```

### Frontend - ListingCard Component (`agri_ui/src/components/ListingCard.jsx`)

**New Props:**
- `onDelete`: Function to call when delete button clicked
- `loading`: Loading state to disable button during deletion

**Changes:**
- ✅ Added `Trash2` icon import from lucide-react
- ✅ Added red "Remove" button next to "View Bids"/Place Bid" button
- ✅ Button only shows for owner (`isOwner={true}`)
- ✅ Button shows trash icon + "Remove" text on desktop, trash icon only on mobile
- ✅ Button disabled during loading

### Frontend - Marketplace Page (`agri_ui/src/pages/Marketplace.jsx`)

**New Handler Function: `handleDeleteListing`**

Features:
- ✅ Confirmation dialog: "Are you sure you want to remove the listing for [cropName]?"
- ✅ POST request to delete endpoint with seller ID
- ✅ Error handling with user-friendly messages
- ✅ Auto-refresh of listings after deletion
- ✅ Success message with crop name

**Updated Component Props:**
- ListingCard now receives:
  - `onDelete={handleDeleteListing}`
  - `loading={loading}`

## User Workflow

1. Farmer goes to "My Listings" tab in marketplace
2. Sees all their active listings with details
3. Clicks red "Remove" button on listing card
4. Gets confirmation dialog: "Are you sure you want to remove the listing for [cropName]?"
5. If confirms:
   - Listing is deleted from database
   - Success message shown: "✅ Listing for "[cropName]" has been removed from marketplace"
   - My Listings refreshes to show updated list
6. If listing has active bids, error message shows:
   - "Cannot delete listing with active bids. Reject all bids first."

## Restrictions

Farmers **cannot** delete a listing if:
- There are any pending bids on the listing
- There are any accepted bids on the listing

This prevents data inconsistency and protects buyer interests.

## Security

- ✅ Backend verifies seller ownership
- ✅ Only the farmer who created the listing can delete it
- ✅ Unauthorized deletion attempts return 403 error
- ✅ Validation ensures no active bids remain

## Testing

To test the feature:

1. **Create a listing** as a farmer
2. **Delete without bids**:
   - Click Remove button
   - Confirm deletion
   - Verify listing disappears from My Listings
3. **Try delete with bids**:
   - Create a new listing
   - Place a bid as another user
   - Try to delete as farmer
   - Verify error message: "Cannot delete listing with active bids..."

## Files Modified

1. `agri_backend/index.js` - Added DELETE endpoint
2. `agri_ui/src/components/ListingCard.jsx` - Added delete button UI
3. `agri_ui/src/pages/Marketplace.jsx` - Added delete handler
