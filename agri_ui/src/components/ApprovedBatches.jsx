import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useContract } from '../hooks/useContract'
import { FaCheckCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'
import { API_BASE_URL } from '../lib/api'

export default function ApprovedBatches({ onTransactionComplete }) {
	const { user } = useAuth()
	const { addDistributor, isConnected, connectWallet, isLoading } = useContract()
	const [approvedBatches, setApprovedBatches] = useState([])
	const [loadingBatches, setLoadingBatches] = useState(true)
	const [processingId, setProcessingId] = useState(null)
	const [error, setError] = useState(null)
	const [successMessage, setSuccessMessage] = useState(null)

	// Fetch approved batches awaiting distributor blockchain transaction
	useEffect(() => {
		fetchApprovedBatches()
		const interval = setInterval(fetchApprovedBatches, 5000) // Poll every 5 seconds
		return () => clearInterval(interval)
	}, [user])

	const fetchApprovedBatches = async () => {
		try {
			// Fetch all approvals where status is approved and distributor_tx_hash is NULL
			const response = await fetch(`${API_BASE_URL}/api/approvals/pending-blockchain/${user?.id || 0}`)
			const data = await response.json()

			if (data.success) {
				setApprovedBatches(data.approvals || [])
			}
		} catch (err) {
			console.error('Fetch error:', err)
		} finally {
			setLoadingBatches(false)
		}
	}

	const handleSubmitToBlockchain = async (batch) => {
		if (!isConnected) {
			await connectWallet()
			return
		}

		setProcessingId(batch.id)
		setError(null)
		setSuccessMessage(null)

		try {
			// Validate all required fields
			const requiredFields = {
				'Batch ID': batch.batch_id,
				'Crop Name': batch.crop_name,
				'Distributor Name': batch.distributor_name,
				'Quantity': batch.quantity_received,
				'Price': batch.purchase_price,
				'Handover Date': batch.handover_date
			};

			const missingFields = Object.entries(requiredFields)
				.filter(([key, value]) => !value || value === null || value === undefined || value === '')
				.map(([key]) => key);

			if (missingFields.length > 0) {
				setError(`❌ Missing required fields: ${missingFields.join(', ')}`);
				setProcessingId(null)
				return
			}

			// Convert batch_id to bytes32 format if needed
			let batchIdBytes32 = batch.batch_id.toString().trim()
			
			// Validate batch ID format
			if (!batchIdBytes32.startsWith('0x')) {
				setError(`❌ Invalid Batch ID format!\n\nBatch ID must start with "0x" and be 66 characters long.\n\nCurrent format: ${batchIdBytes32}\n\nPlease ensure the Batch ID from blockchain is correct.`);
				setProcessingId(null)
				return
			}
			
			if (batchIdBytes32.length !== 66) {
				setError(`❌ Invalid Batch ID length!\n\nExpected: 66 characters (0x + 64 hex)\nReceived: ${batchIdBytes32.length} characters\n\nBatch ID: ${batchIdBytes32}\n\nPlease check the blockchain batch ID and try again.`);
				setProcessingId(null)
				return
			}

			// Validate numeric fields
			const quantityNum = parseFloat(batch.quantity_received);
			const priceNum = parseFloat(batch.purchase_price);

			if (isNaN(quantityNum) || quantityNum <= 0) {
				setError(`❌ Invalid Quantity!\n\nQuantity must be a positive number.\n\nCurrent value: ${batch.quantity_received}`);
				setProcessingId(null)
				return
			}

			if (isNaN(priceNum) || priceNum < 0) {
				setError(`❌ Invalid Price!\n\nPrice must be a valid number (can be 0 or positive).\n\nCurrent value: ${batch.purchase_price}`);
				setProcessingId(null)
				return
			}

			console.log('✅ All validations passed. Submitting batch to blockchain:', {
				batchId: batchIdBytes32,
				cropName: batch.crop_name,
				distributorName: batch.distributor_name,
				quantityReceived: quantityNum,
				purchasePrice: priceNum
			})

			// Submit to blockchain
			const txHash = await addDistributor(
				batchIdBytes32,
				batch.crop_name,
				batch.distributor_name,
				quantityNum,
				priceNum,
				batch.transport_details || 'Standard Transport',
				batch.warehouse_location || 'Default Warehouse',
				batch.handover_date || Math.floor(Date.now() / 1000)
			)

			// Update database with distributor tx hash
			const response = await fetch(`${API_BASE_URL}/api/approvals/${batch.id}/blockchain-confirm`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ distributorTxHash: txHash })
			})

			const data = await response.json()

			if (data.success) {
				setSuccessMessage(`✅ Batch "${batch.batch_id}" submitted to blockchain!\n\nTransaction Hash: ${txHash}`)
				setApprovedBatches(approvedBatches.filter(b => b.id !== batch.id))
				if (onTransactionComplete) {
					onTransactionComplete(txHash)
				}
			} else {
				setError(`❌ Database Error:\n\n${data.error || 'Failed to confirm blockchain submission'}`)
			}
		} catch (err) {
			console.error('Error submitting to blockchain:', err)
			setError(`❌ Transaction Error:\n\n${err.message || 'Failed to submit to blockchain'}\n\nPlease check:\n1. Wallet is connected\n2. Sufficient balance\n3. Batch ID is valid (0x + 64 hex chars)`)
		} finally {
			setProcessingId(null)
		}
	}

	if (loadingBatches) {
		return (
			<div className="bg-white rounded-lg border border-slate-200 p-6">
				<h3 className="text-xl font-semibold text-slate-900 mb-4">Approved Batches - Ready for Blockchain</h3>
				<div className="flex items-center justify-center py-8">
					<FaSpinner className="animate-spin text-primary text-2xl" />
					<span className="ml-2 text-slate-600">Loading approved batches...</span>
				</div>
			</div>
		)
	}

	if (approvedBatches.length === 0) {
		return null // Don't show if no approved batches
	}

	return (
		<div className="bg-white rounded-lg border border-slate-200 p-6 w-full max-w-full">
			<h3 className="text-xl font-semibold text-slate-900 mb-2">✅ Approved Batches - Ready for Blockchain</h3>
			<p className="text-sm text-slate-600 mb-4">Farmer has approved these batches. Submit them to blockchain now.</p>

			{error && (
				<div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg w-full overflow-hidden">
					<div className="flex items-start gap-3">
						<FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0 mt-1" />
						<div className="flex-1 min-w-0">
							<p className="text-red-800 font-semibold mb-1">Error:</p>
							<p className="text-red-700 text-sm whitespace-pre-wrap break-words overflow-hidden">{error}</p>
						</div>
					</div>
				</div>
			)}

			{successMessage && (
				<div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg w-full overflow-hidden">
					<div className="flex items-start gap-3">
						<FaCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-1" />
						<div className="flex-1 min-w-0">
							<p className="text-green-800 font-semibold mb-1">Success:</p>
							<p className="text-green-700 text-sm whitespace-pre-wrap break-words overflow-hidden">{successMessage}</p>
						</div>
					</div>
				</div>
			)}

			<div className="space-y-4">
				{approvedBatches.map(batch => (
					<div key={batch.id} className="border border-green-200 rounded-lg p-4 bg-green-50 hover:shadow-md transition-shadow">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Batch ID</p>
								<p className="text-slate-900 font-semibold">{batch.batch_id}</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Status</p>
								<p className="text-green-700 font-semibold">✅ Farmer Approved</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Crop Name</p>
								<p className="text-slate-900">{batch.crop_name}</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Quantity (kg)</p>
								<p className="text-slate-900">{parseFloat(batch.quantity_received).toFixed(2)}</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Price (₹)</p>
								<p className="text-slate-900">₹{parseFloat(batch.purchase_price).toFixed(2)}</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Farmer Email</p>
								<p className="text-slate-900 text-sm">{batch.farmer_email}</p>
							</div>
						</div>

						<div className="pt-4 border-t border-green-200">
							{!isConnected ? (
								<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-700 text-center mb-3">
									Connect your MetaMask wallet to submit to blockchain
								</div>
							) : null}

							<button
								onClick={() => handleSubmitToBlockchain(batch)}
								disabled={processingId === batch.id}
								className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-primary text-white font-medium hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
							>
								{processingId === batch.id ? (
									<>
										<FaSpinner className="animate-spin" />
										Submitting to Blockchain...
									</>
								) : (
									<>
										<FaCheckCircle />
										Submit to Blockchain
									</>
								)}
							</button>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
