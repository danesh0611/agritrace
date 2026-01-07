import { useState, useCallback } from 'react'
import { BrowserProvider, Contract } from 'ethers'

// SupplyChainTracker contract ABI
const SUPPLY_CHAIN_ABI = [
  'function addDistributor(bytes32 batchId, string memory cropName, string memory distributorName, uint256 quantityReceived, uint256 purchasePrice, string memory transportDetails, string memory warehouseLocation, uint256 handoverDate) public',
  'function getProduce(bytes32 batchId) public view returns (tuple(tuple(string farmerName, string cropName, uint256 quantity, uint256 remainingQuantity, uint256 pricePerKg, string location, uint256 createdDate, uint256 expiryDate, address farmer) farmerInfo, tuple(string distributorName, uint256 quantityReceived, uint256 remainingQuantity, uint256 purchasePrice, string transportDetails, string warehouseLocation, uint256 handoverDate, uint256 timestamp, address distributor)[] distributors, tuple(string retailerName, string shopLocation, uint256 retailQuantity, uint256 retailPurchasePrice, uint256 consumerPrice, uint256 timestamp, address retailer, string distributorName)[] retailers, uint8 stage))'
];

// Deployed SupplyChainTracker contract address on Sepolia
const SUPPLY_CHAIN_CONTRACT_ADDRESS = import.meta.env.VITE_SUPPLY_CHAIN_ADDRESS || '0x0000000000000000000000000000000000000000';

export const useSupplyChain = () => {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Add buyer as distributor to blockchain batch
  const addBuyerAsDistributor = useCallback(async (
    batchId,
    cropName,
    buyerName,
    quantityKg,
    totalAmount,
    buyerLocation = 'Marketplace'
  ) => {
    try {
      setIsLoading(true);
      setError('');

      if (!SUPPLY_CHAIN_CONTRACT_ADDRESS || SUPPLY_CHAIN_CONTRACT_ADDRESS === '0x0000000000000000000000000000000000000000') {
        console.warn('SupplyChainTracker contract not configured - skipping blockchain record');
        return {
          success: true,
          message: 'Escrow recorded (blockchain record skipped)',
          txHash: null
        };
      }

      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const supplyChain = new Contract(SUPPLY_CHAIN_CONTRACT_ADDRESS, SUPPLY_CHAIN_ABI, signer);

      // Add buyer as a "distributor" on the blockchain batch
      const tx = await supplyChain.addDistributor(
        batchId,                    // batch ID (bytes32)
        cropName,                   // crop name to verify
        buyerName,                  // buyer's name = "distributor" name
        quantityKg,                 // quantity ordered
        totalAmount,                // price paid (in rupees, stored as wei equivalent)
        'Marketplace Purchase',     // transport details
        buyerLocation,              // warehouse = buyer location
        Math.floor(Date.now() / 1000) // handover date = now
      );

      const receipt = await tx.wait();

      return {
        success: true,
        txHash: receipt.hash,
        message: `Buyer linked to batch on blockchain: ${receipt.hash.substring(0, 10)}...`
      };
    } catch (err) {
      console.error('Error adding distributor to blockchain batch:', err);
      setError(err.message || 'Failed to link buyer to blockchain batch');
      return {
        success: false,
        error: err.message,
        message: `Could not link to blockchain: ${err.message}`
      };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    addBuyerAsDistributor,
    error,
    isLoading
  };
};
