AgriTrace – Blockchain-Based Agricultural Supply Chain Transparency
AgriTrace is a blockchain-powered agricultural supply chain tracking platform that enables transparent tracking of agricultural produce from farmers to consumers.
The system ensures traceability, farmer oversight, and immutable records using Ethereum smart contracts.

The platform integrates React frontend, Node.js backend, Azure SQL database, and Ethereum blockchain (Sepolia testnet) to provide a decentralized yet practical solution for agricultural supply chains.

Key Features
• Blockchain-based supply chain tracking
• Farmer approval workflow for distributor submissions
• Immutable batch records using Ethereum smart contracts
• QR-based consumer traceability
• Secure batch lifecycle tracking (Farmer → Distributor → Retailer)
• Smart contract validation for quantity and expiry
• Azure SQL database for off-chain records
• MetaMask integration for blockchain transactions

Technology Stack
Frontend
React.js
Vite
Web3.js / Ethers.js

Backend
Node.js
Express.js
Azure App Service

Database
Azure SQL Database

Blockchain
Ethereum Sepolia Testnet
Solidity Smart Contracts
Remix IDE

Authentication
Username / Password authentication

System Architecture

Frontend (React)
        │
        ▼
Backend API (Node.js + Express)
        │
        ├──────── Azure SQL Database
        │
        ▼
Ethereum Blockchain (Sepolia)
Smart Contract: SupplyChainTracker
The database stores application data and approval workflows, while the blockchain stores immutable supply chain records.

Supply Chain Workflow
The system follows a farmer-controlled approval workflow to ensure transparency.

Step 1 – Distributor Submission (Database Only)
Distributor submits batch details:

• Batch ID
• Crop name
• Quantity
• Purchase price
• Transport details
• Warehouse location
• Farmer email

The submission is stored in the database:


Table: farmer_approvals
status = "pending"
distributor_tx_hash = NULL
farmer_tx_hash = NULL
No blockchain transaction occurs at this stage.

Step 2 – Farmer Approval
The farmer logs into the system and reviews pending submissions.

The farmer can:

• Approve batch
• Reject batch

Approval updates database status:


status = "approved"
Still no blockchain transaction yet.

Step 3 – Distributor Blockchain Submission
After farmer approval, the distributor submits the batch to the blockchain.

Distributor:

Connects MetaMask

Signs transaction

Calls smart contract addDistributor()

The transaction hash is stored in the database.


status = "approved"
distributor_tx_hash = 0xabc...
This creates permanent blockchain proof of the transaction.

Smart Contract Overview
The system uses the SupplyChainTracker smart contract written in Solidity.

The contract manages:

• Produce batch creation by farmers
• Distributor batch claims
• Retailer supply updates
• Quantity validation
• Expiry validation

Main Functions
createProduce()
Creates a new produce batch.

addDistributor()
Distributor receives produce from farmer.

addRetailer()
Retailer receives produce from distributor.

isExpired()
Checks whether produce has expired.

Database Schema
Main table used for approval workflow:


farmer_approvals

id
batch_id
crop_name
distributor_id
distributor_name
quantity_received
purchase_price
transport_details
warehouse_location
handover_date
farmer_email
status
distributor_tx_hash
farmer_tx_hash
created_at
updated_at
Status values:


pending
approved
rejected
API Endpoints
Submit Batch for Farmer Approval
POST /api/approvals/submit

Stores distributor submission in database.


{
  "batchId": "BATCH-001",
  "cropName": "Wheat",
  "distributorId": 1,
  "distributorName": "Green Farms",
  "quantityReceived": 500,
  "purchasePrice": 25000,
  "transportDetails": "Truck TN-001",
  "warehouseLocation": "Chennai",
  "handoverDate": 1699603200,
  "farmerEmail": "farmer@test.com"
}
Get Pending Approvals
GET /api/approvals/pending/:farmerEmail

Returns all batches waiting for farmer approval.

Approve Batch
POST /api/approvals/:id/approve

Farmer approves distributor submission.

Reject Batch
POST /api/approvals/:id/reject

Marks submission as rejected.

Get Approved Batches
GET /api/approvals/approved/:farmerEmail

Returns batches where approval workflow is completed.

Running the Project
Backend

cd agri_backend
npm install
npm start
Server runs at:


http://localhost:5000
Frontend

cd agri_ui
npm install
npm run dev
Frontend runs at:


http://localhost:5173
Test Workflow
Create distributor account

Create farmer account

Distributor:

• Submit batch for approval

Farmer:

• Review pending batch
• Approve submission

Distributor:

• Submit approved batch to blockchain
• Sign transaction with MetaMask

The blockchain transaction hash is stored in the database.

Future Enhancements
• Email notifications for farmer approvals
• Marketplace escrow smart contract integration
• IoT-based crop quality tracking
• Automated QR-based consumer verification
• Mobile application for farmers

License
MIT License

Author
Chakradhar
SRM Institute of Science and Technology

