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
			// Submit to blockchain
			const txHash = await addDistributor(
				batch.batch_id,
				batch.crop_name,
				batch.distributor_name,
				batch.quantity_received,
				batch.purchase_price,
				batch.transport_details,
				batch.warehouse_location,
				batch.handover_date
			)

		// Update database with distributor tx hash
		const response = await fetch(`${API_BASE_URL}/api/approvals/${batch.id}/blockchain-confirm`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ distributorTxHash: txHash })
			})

			const data = await response.json()

			if (data.success) {
				setSuccessMessage(`✅ Batch "${batch.batch_id}" submitted to blockchain! Transaction: ${txHash}`)
				setApprovedBatches(approvedBatches.filter(b => b.id !== batch.id))
				if (onTransactionComplete) {
					onTransactionComplete(txHash)
				}
			} else {
				setError(data.error || 'Failed to confirm blockchain submission')
			}
		} catch (err) {
			console.error('Error submitting to blockchain:', err)
			setError(err.message || 'Failed to submit to blockchain')
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
		<div className="bg-white rounded-lg border border-slate-200 p-6">
			<h3 className="text-xl font-semibold text-slate-900 mb-2">✅ Approved Batches - Ready for Blockchain</h3>
			<p className="text-sm text-slate-600 mb-4">Farmer has approved these batches. Submit them to blockchain now.</p>

			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
					<FaExclamationTriangle className="text-red-500" />
					<span className="text-red-700">{error}</span>
				</div>
			)}

			{successMessage && (
				<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-2">
					<FaCheckCircle className="text-green-500" />
					<span className="text-green-700">{successMessage}</span>
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
