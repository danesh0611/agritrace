// Contract ABI for SupplyChainTracker
export const SUPPLY_CHAIN_ABI = [
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			},
			{
				"internalType": "string",
				"name": "cropName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "distributorName",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "quantityReceived",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "purchasePrice",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "transportDetails",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "warehouseLocation",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "handoverDate",
				"type": "uint256"
			}
		],
		"name": "addDistributor",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			},
			{
				"internalType": "string",
				"name": "cropName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "distributorName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "retailerName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "shopLocation",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "retailQuantity",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "retailPurchasePrice",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "consumerPrice",
				"type": "uint256"
			}
		],
		"name": "addRetailer",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "string",
				"name": "farmerName",
				"type": "string"
			},
			{
				"internalType": "string",
				"name": "cropName",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "quantity",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "pricePerKg",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "location",
				"type": "string"
			},
			{
				"internalType": "uint256",
				"name": "expiryDate",
				"type": "uint256"
			}
		],
		"name": "createProduce",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "distributor",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "qty",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "Distributed",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			},
			{
				"indexed": false,
				"internalType": "string",
				"name": "message",
				"type": "string"
			}
		],
		"name": "ExpiredProductAccess",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "farmer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "expiryDate",
				"type": "uint256"
			}
		],
		"name": "ProduceCreated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "retailer",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "qty",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "price",
				"type": "uint256"
			}
		],
		"name": "RetailUpdated",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "batchNonce",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			}
		],
		"name": "canPurchase",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "farmerBatches",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			}
		],
		"name": "getBatchInfoWithExpiry",
		"outputs": [
			{
				"components": [
					{
						"components": [
							{
								"internalType": "string",
								"name": "farmerName",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "cropName",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "quantity",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "remainingQuantity",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "pricePerKg",
								"type": "uint256"
							},
							{
								"internalType": "string",
								"name": "location",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "createdDate",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "expiryDate",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "farmer",
								"type": "address"
							}
						],
						"internalType": "struct SupplyChainTracker.FarmerInfo",
						"name": "farmerInfo",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "string",
								"name": "distributorName",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "quantityReceived",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "remainingQuantity",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "purchasePrice",
								"type": "uint256"
							},
							{
								"internalType": "string",
								"name": "transportDetails",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "warehouseLocation",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "handoverDate",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "timestamp",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "distributor",
								"type": "address"
							}
						],
						"internalType": "struct SupplyChainTracker.DistributorInfo[]",
						"name": "distributors",
						"type": "tuple[]"
					},
					{
						"components": [
							{
								"internalType": "string",
								"name": "retailerName",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "shopLocation",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "retailQuantity",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "retailPurchasePrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "consumerPrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "timestamp",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "retailer",
								"type": "address"
							},
							{
								"internalType": "string",
								"name": "distributorName",
								"type": "string"
							}
						],
						"internalType": "struct SupplyChainTracker.RetailInfo[]",
						"name": "retailers",
						"type": "tuple[]"
					},
					{
						"internalType": "enum SupplyChainTracker.Stage",
						"name": "stage",
						"type": "uint8"
					}
				],
				"internalType": "struct SupplyChainTracker.Produce",
				"name": "produce",
				"type": "tuple"
			},
			{
				"internalType": "bool",
				"name": "expired",
				"type": "bool"
			},
			{
				"internalType": "string",
				"name": "expiryStatus",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "distributorIndex",
				"type": "uint256"
			}
		],
		"name": "getDistributorRemainingQuantity",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			}
		],
		"name": "getExpiryDate",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			}
		],
		"name": "getExpiryInfo",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "expiryDate",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "expired",
				"type": "bool"
			},
			{
				"internalType": "uint256",
				"name": "daysLeft",
				"type": "uint256"
			},
			{
				"internalType": "string",
				"name": "status",
				"type": "string"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "farmer",
				"type": "address"
			}
		],
		"name": "getFarmerBatches",
		"outputs": [
			{
				"internalType": "bytes32[]",
				"name": "",
				"type": "bytes32[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			}
		],
		"name": "getFarmerRemainingQuantity",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			}
		],
		"name": "getProduce",
		"outputs": [
			{
				"components": [
					{
						"components": [
							{
								"internalType": "string",
								"name": "farmerName",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "cropName",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "quantity",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "remainingQuantity",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "pricePerKg",
								"type": "uint256"
							},
							{
								"internalType": "string",
								"name": "location",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "createdDate",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "expiryDate",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "farmer",
								"type": "address"
							}
						],
						"internalType": "struct SupplyChainTracker.FarmerInfo",
						"name": "farmerInfo",
						"type": "tuple"
					},
					{
						"components": [
							{
								"internalType": "string",
								"name": "distributorName",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "quantityReceived",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "remainingQuantity",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "purchasePrice",
								"type": "uint256"
							},
							{
								"internalType": "string",
								"name": "transportDetails",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "warehouseLocation",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "handoverDate",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "timestamp",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "distributor",
								"type": "address"
							}
						],
						"internalType": "struct SupplyChainTracker.DistributorInfo[]",
						"name": "distributors",
						"type": "tuple[]"
					},
					{
						"components": [
							{
								"internalType": "string",
								"name": "retailerName",
								"type": "string"
							},
							{
								"internalType": "string",
								"name": "shopLocation",
								"type": "string"
							},
							{
								"internalType": "uint256",
								"name": "retailQuantity",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "retailPurchasePrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "consumerPrice",
								"type": "uint256"
							},
							{
								"internalType": "uint256",
								"name": "timestamp",
								"type": "uint256"
							},
							{
								"internalType": "address",
								"name": "retailer",
								"type": "address"
							},
							{
								"internalType": "string",
								"name": "distributorName",
								"type": "string"
							}
						],
						"internalType": "struct SupplyChainTracker.RetailInfo[]",
						"name": "retailers",
						"type": "tuple[]"
					},
					{
						"internalType": "enum SupplyChainTracker.Stage",
						"name": "stage",
						"type": "uint8"
					}
				],
				"internalType": "struct SupplyChainTracker.Produce",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "batchId",
				"type": "bytes32"
			}
		],
		"name": "isExpired",
		"outputs": [
			{
				"internalType": "bool",
				"name": "",
				"type": "bool"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "bytes32",
				"name": "",
				"type": "bytes32"
			}
		],
		"name": "produceItems",
		"outputs": [
			{
				"components": [
					{
						"internalType": "string",
						"name": "farmerName",
						"type": "string"
					},
					{
						"internalType": "string",
						"name": "cropName",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "quantity",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "remainingQuantity",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "pricePerKg",
						"type": "uint256"
					},
					{
						"internalType": "string",
						"name": "location",
						"type": "string"
					},
					{
						"internalType": "uint256",
						"name": "createdDate",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "expiryDate",
						"type": "uint256"
					},
					{
						"internalType": "address",
						"name": "farmer",
						"type": "address"
					}
				],
				"internalType": "struct SupplyChainTracker.FarmerInfo",
				"name": "farmerInfo",
				"type": "tuple"
			},
			{
				"internalType": "enum SupplyChainTracker.Stage",
				"name": "stage",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
]

export const CONTRACT_ADDRESS = "0x5134A509ecCf408fDec6134fd2508e469D788e28"
