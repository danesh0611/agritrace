import { useState } from 'react'
import { useContract } from '../hooks/useContract'
import { FaCamera, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'
import BatchTracker from './BatchTracker'

export default function QRScanner() {
	const { getProduce, isConnected, connectWallet, isLoading } = useContract()
	const [scannedBatchId, setScannedBatchId] = useState('')
	const [produceData, setProduceData] = useState(null)
	const [isLoadingProduce, setIsLoadingProduce] = useState(false)
	const [error, setError] = useState('')
	const [showManualInput, setShowManualInput] = useState(true)

	const handleManualSearch = async (e) => {
		e.preventDefault()
		
		if (!scannedBatchId.trim()) {
			setError('Please enter a batch ID')
			return
		}

		if (!isConnected) {
			await connectWallet()
			return
		}

		await fetchBatchDetails(scannedBatchId)
	}

	const fetchBatchDetails = async (batchId) => {
		setIsLoadingProduce(true)
		setError('')
		setProduceData(null)

		try {
			// Validate that it's a proper batch ID (should be 66 chars with 0x prefix for bytes32)
			if (batchId.length !== 66 || !batchId.startsWith('0x')) {
				throw new Error('Invalid batch ID format. Batch IDs should start with "0x" and be 66 characters long.')
			}
			
			const data = await getProduce(batchId)
			console.log('Fetched produce data:', data) // Debug log
			setProduceData(data)
		} catch (err) {
			console.error('Error fetching produce:', err)
			setError(`Failed to fetch batch details: ${err.message || 'Please check the batch ID.'}`)
		} finally {
			setIsLoadingProduce(false)
		}
	}

	const formatDate = (timestamp) => {
		if (!timestamp || timestamp === '0') return 'N/A'
		return new Date(parseInt(timestamp) * 1000).toLocaleDateString()
	}

	const formatAddress = (address) => {
		if (!address) return 'N/A'
		return `${address.slice(0, 6)}...${address.slice(-4)}`
	}

	const getStageText = (stage) => {
		const stageNum = parseInt(stage)
		switch (stageNum) {
			case 0: return 'Created (Farmer)'
			case 1: return 'Distributed'
			case 2: return 'Retail'
			default: return `Unknown (${stage})`
		}
	}

	const getStageColor = (stage) => {
		const stageNum = parseInt(stage)
		switch (stageNum) {
			case 0: return 'bg-blue-100 text-blue-800'
			case 1: return 'bg-yellow-100 text-yellow-800'
			case 2: return 'bg-green-100 text-green-800'
			default: return 'bg-gray-100 text-gray-800'
		}
	}

	if (!isConnected) {
		return (
			<div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
				<div className="text-center">
					<FaExclamationTriangle className="mx-auto text-yellow-500 text-3xl mb-4" />
					<p className="text-gray-600 mb-4">Connect your MetaMask wallet to scan QR codes</p>
					<button
						onClick={connectWallet}
						disabled={isLoading}
						className="inline-flex items-center gap-2 px-6 py-3 rounded-md bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors"
					>
						{isLoading ? <FaSpinner className="animate-spin" /> : null}
						Connect Wallet
					</button>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Manual Input Section */}
			<div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
				<form onSubmit={handleManualSearch} className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Enter Batch ID manually:
						</label>
						<input
							type="text"
							value={scannedBatchId}
							onChange={(e) => setScannedBatchId(e.target.value)}
							placeholder="Enter Batch ID (e.g., 0x123...)"
							className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						/>
					</div>
					<button
						type="submit"
						disabled={isLoadingProduce || isLoading}
						className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60 transition-colors"
					>
						{isLoadingProduce ? <FaSpinner className="animate-spin" /> : <FaCamera />}
						Fetch Batch Details
					</button>
				</form>
			</div>

			{/* Error Messages */}
			{error && (
				<div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
					<FaExclamationTriangle className="text-red-500" />
					<span className="text-red-700">{error}</span>
				</div>
			)}

			{/* Batch Details */}
			{produceData && (
				<div className="bg-white rounded-lg border border-gray-200 p-6 space-y-6">
					<h3 className="text-xl font-bold text-gray-900 mb-4">Batch Details</h3>
					
					{/* Stage Badge */}
					<div className="flex justify-center">
						<span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStageColor(produceData.stage)}`}>
							Stage: {getStageText(produceData.stage)}
						</span>
					</div>

					{/* Next Steps Guide */}
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<h4 className="text-lg font-semibold text-blue-800 mb-2 flex items-center gap-2">
							📋 Next Steps
						</h4>
						{parseInt(produceData.stage) === 0 && (
							<p className="text-blue-700">
								This batch is at the farmer stage. To add distributor information, go to the <strong>Blockchain Dashboard</strong> and use the <strong>Distributor Form</strong> with this Batch ID: <code className="bg-blue-100 px-2 py-1 rounded">{scannedBatchId}</code>
							</p>
						)}
						{parseInt(produceData.stage) === 1 && (
							<p className="text-blue-700">
								This batch has distributor information. To add retailer information, go to the <strong>Blockchain Dashboard</strong> and use the <strong>Retailer Form</strong> with this Batch ID: <code className="bg-blue-100 px-2 py-1 rounded">{scannedBatchId}</code>
							</p>
						)}
						{parseInt(produceData.stage) === 2 && (
							<p className="text-blue-700">
								This batch has complete supply chain information from farmer to retailer! ✅
							</p>
						)}
					</div>

					{/* Farmer Information */}
					<div className="bg-green-50 border border-green-200 rounded-lg p-4">
						<h4 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2">
							🌱 Farmer Information
						</h4>
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div>
								<span className="text-sm font-medium text-green-700">Farmer Name:</span>
								<p className="text-green-900">{produceData.farmerInfo.farmerName}</p>
							</div>
							<div>
								<span className="text-sm font-medium text-green-700">Crop Name:</span>
								<p className="text-green-900">{produceData.farmerInfo.cropName}</p>
							</div>
							<div>
								<span className="text-sm font-medium text-green-700">Total Quantity:</span>
								<p className="text-green-900">{produceData.farmerInfo.quantity} kg</p>
							</div>
							<div>
								<span className="text-sm font-medium text-green-700">Remaining Quantity:</span>
								<p className="text-green-900">{produceData.farmerInfo.remainingQuantity} kg</p>
							</div>
							<div>
								<span className="text-sm font-medium text-green-700">Price per kg:</span>
								<p className="text-green-900">₹{produceData.farmerInfo.pricePerKg}</p>
							</div>
							<div>
								<span className="text-sm font-medium text-green-700">Location:</span>
								<p className="text-green-900">{produceData.farmerInfo.location}</p>
							</div>
							<div>
								<span className="text-sm font-medium text-green-700">Harvest Date:</span>
								<p className="text-green-900">{formatDate(produceData.farmerInfo.harvestDate)}</p>
							</div>
							<div>
								<span className="text-sm font-medium text-green-700">Farmer Address:</span>
								<p className="text-green-900 font-mono">{formatAddress(produceData.farmerInfo.farmer)}</p>
							</div>
						</div>
					</div>

					{/* Distributor Information */}
					{produceData.distributors && produceData.distributors.length > 0 ? (
						<div className="space-y-4">
							<h4 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
								🚛 Distributors ({produceData.distributors.length})
							</h4>
							{produceData.distributors.map((distributor, index) => (
								<div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<span className="text-sm font-medium text-yellow-700">Distributor Name:</span>
											<p className="text-yellow-900">{distributor.distributorName}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-yellow-700">Quantity Received:</span>
											<p className="text-yellow-900">{distributor.quantityReceived} kg</p>
										</div>
										<div>
											<span className="text-sm font-medium text-yellow-700">Remaining Quantity:</span>
											<p className="text-yellow-900">{distributor.remainingQuantity} kg</p>
										</div>
										<div>
											<span className="text-sm font-medium text-yellow-700">Purchase Price:</span>
											<p className="text-yellow-900">₹{distributor.purchasePrice}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-yellow-700">Warehouse Location:</span>
											<p className="text-yellow-900">{distributor.warehouseLocation}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-yellow-700">Handover Date:</span>
											<p className="text-yellow-900">{formatDate(distributor.handoverDate)}</p>
										</div>
										<div className="md:col-span-2">
											<span className="text-sm font-medium text-yellow-700">Transport Details:</span>
											<p className="text-yellow-900">{distributor.transportDetails}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-yellow-700">Distributor Address:</span>
											<p className="text-yellow-900 font-mono">{formatAddress(distributor.distributor)}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					) : parseInt(produceData.stage) === 0 ? (
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
							<h4 className="text-lg font-semibold text-gray-600 mb-3 flex items-center gap-2">
								🚛 Distributor Information
							</h4>
							<p className="text-gray-500 text-center py-4">
								Distributor information will appear here once a distributor is added to this batch.
							</p>
						</div>
					) : null}

					{/* Retailer Information */}
					{produceData.retailers && produceData.retailers.length > 0 ? (
						<div className="space-y-4">
							<h4 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
								🏪 Retailers ({produceData.retailers.length})
							</h4>
							{produceData.retailers.map((retailer, index) => (
								<div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
									<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
										<div>
											<span className="text-sm font-medium text-blue-700">Retailer Name:</span>
											<p className="text-blue-900">{retailer.retailerName}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-blue-700">Shop Location:</span>
											<p className="text-blue-900">{retailer.shopLocation}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-blue-700">Retail Quantity:</span>
											<p className="text-blue-900">{retailer.retailQuantity} kg</p>
										</div>
										<div>
											<span className="text-sm font-medium text-blue-700">Purchase Price:</span>
											<p className="text-blue-900">₹{retailer.retailPurchasePrice}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-blue-700">Consumer Price:</span>
											<p className="text-blue-900">₹{retailer.consumerPrice}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-blue-700">Expiry Date:</span>
											<p className="text-blue-900">{formatDate(retailer.expiryDate)}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-blue-700">From Distributor:</span>
											<p className="text-blue-900">{retailer.distributorName}</p>
										</div>
										<div>
											<span className="text-sm font-medium text-blue-700">Retailer Address:</span>
											<p className="text-blue-900 font-mono">{formatAddress(retailer.retailer)}</p>
										</div>
									</div>
								</div>
							))}
						</div>
					) : parseInt(produceData.stage) <= 1 ? (
						<div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
							<h4 className="text-lg font-semibold text-gray-600 mb-3 flex items-center gap-2">
								🏪 Retailer Information
							</h4>
							<p className="text-gray-500 text-center py-4">
								Retailer information will appear here once a retailer is added to this batch.
							</p>
						</div>
					) : null}
				</div>
			)}

			{/* New: Show marketplace orders and full batch journey */}
			{produceData && scannedBatchId && (
				<div className="mt-8">
					<BatchTracker batchId={scannedBatchId} />
				</div>
			)}
		</div>
	)
}
