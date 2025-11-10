import { useState, useEffect } from 'react'
import { useContract } from '../hooks/useContract'
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaExclamationTriangle } from 'react-icons/fa'

export default function FarmerApprovals({ farmerEmail, onApprovalComplete }) {
	const { createProduce, isConnected, connectWallet, isLoading } = useContract()
	const [approvals, setApprovals] = useState([])
	const [loadingApprovals, setLoadingApprovals] = useState(true)
	const [processingId, setProcessingId] = useState(null)
	const [error, setError] = useState(null)
	const [successMessage, setSuccessMessage] = useState(null)

	// Fetch pending approvals for this farmer
	useEffect(() => {
		fetchPendingApprovals()
		const interval = setInterval(fetchPendingApprovals, 5000) // Poll every 5 seconds
		return () => clearInterval(interval)
	}, [farmerEmail])

	const fetchPendingApprovals = async () => {
		try {
			const response = await fetch(`http://localhost:5000/api/approvals/pending/${farmerEmail}`)
			const data = await response.json()

			if (data.success) {
				setApprovals(data.approvals || [])
			} else {
				console.error('Error fetching approvals:', data.error)
			}
		} catch (err) {
			console.error('Fetch error:', err)
		} finally {
			setLoadingApprovals(false)
		}
	}

	const handleApprove = async (approval) => {
		setProcessingId(approval.id)
		setError(null)
		setSuccessMessage(null)

		try {
			// Only update database status to "approved" (NO blockchain yet)
			// Distributor will do blockchain transaction after seeing approval
			const response = await fetch(`http://localhost:5000/api/approvals/${approval.id}/approve`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ farmerTxHash: null })  // No TX hash yet
			})

			const data = await response.json()

			if (data.success) {
				setSuccessMessage(`✅ Batch "${approval.batch_id}" approved! Distributor will now perform the blockchain transaction.`)
				// Remove from pending list
				setApprovals(approvals.filter(a => a.id !== approval.id))
				if (onApprovalComplete) {
					onApprovalComplete(approval.id)
				}
			} else {
				setError(data.error || 'Failed to approve')
			}
		} catch (err) {
			console.error('Error approving:', err)
			setError(err.message || 'Failed to process approval')
		} finally {
			setProcessingId(null)
		}
	}

	const handleReject = async (approval) => {
		setProcessingId(approval.id)
		setError(null)
		setSuccessMessage(null)

		try {
			const response = await fetch(`http://localhost:5000/api/approvals/${approval.id}/reject`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ farmerTxHash: null })
			})

			const data = await response.json()

			if (data.success) {
				setSuccessMessage(`Batch "${approval.batch_id}" rejected.`)
				// Remove from pending list
				setApprovals(approvals.filter(a => a.id !== approval.id))
			} else {
				setError(data.error || 'Failed to reject')
			}
		} catch (err) {
			console.error('Error rejecting:', err)
			setError(err.message || 'Failed to process rejection')
		} finally {
			setProcessingId(null)
		}
	}

	if (loadingApprovals) {
		return (
			<div className="bg-white rounded-lg border border-slate-200 p-6">
				<h3 className="text-xl font-semibold text-slate-900 mb-4">Pending Approvals</h3>
				<div className="flex items-center justify-center py-8">
					<FaSpinner className="animate-spin text-primary text-2xl" />
					<span className="ml-2 text-slate-600">Loading approvals...</span>
				</div>
			</div>
		)
	}

	if (approvals.length === 0) {
		return (
			<div className="bg-white rounded-lg border border-slate-200 p-6">
				<h3 className="text-xl font-semibold text-slate-900 mb-4">Pending Approvals</h3>
				<div className="text-center py-8">
					<FaCheckCircle className="mx-auto text-green-500 text-3xl mb-2" />
					<p className="text-slate-600">No pending approvals</p>
				</div>
			</div>
		)
	}

	return (
		<div className="bg-white rounded-lg border border-slate-200 p-6">
			<h3 className="text-xl font-semibold text-slate-900 mb-4">Pending Approvals</h3>

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
				{approvals.map(approval => (
					<div key={approval.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Batch ID</p>
								<p className="text-slate-900 font-semibold">{approval.batch_id}</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Crop Name</p>
								<p className="text-slate-900">{approval.crop_name}</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Distributor</p>
								<p className="text-slate-900">{approval.distributor_name}</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Quantity (kg)</p>
								<p className="text-slate-900">{parseFloat(approval.quantity_received).toFixed(2)}</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Purchase Price (₹)</p>
								<p className="text-slate-900">₹{parseFloat(approval.purchase_price).toFixed(2)}</p>
							</div>
							<div>
								<p className="text-xs text-slate-500 uppercase font-semibold">Warehouse</p>
								<p className="text-slate-900">{approval.warehouse_location}</p>
							</div>
							<div className="md:col-span-2">
								<p className="text-xs text-slate-500 uppercase font-semibold">Transport Details</p>
								<p className="text-slate-900 text-sm">{approval.transport_details}</p>
							</div>
						</div>

						<div className="flex gap-3 pt-4 border-t border-slate-200">
							<button
								onClick={() => handleApprove(approval)}
								disabled={processingId === approval.id}
								className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
							>
								{processingId === approval.id ? (
									<>
										<FaSpinner className="animate-spin" />
										Approving...
									</>
								) : (
									<>
										<FaCheckCircle />
										Approve Batch
									</>
								)}
							</button>
							<button
								onClick={() => handleReject(approval)}
								disabled={processingId === approval.id}
								className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
							>
								{processingId === approval.id ? (
									<>
										<FaSpinner className="animate-spin" />
										Rejecting...
									</>
								) : (
									<>
										<FaTimesCircle />
										Reject
									</>
								)}
							</button>
						</div>

						<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-700">
							<p className="font-medium mb-1">⚡ Workflow:</p>
							<p>After you approve → Distributor will perform the blockchain transaction</p>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
