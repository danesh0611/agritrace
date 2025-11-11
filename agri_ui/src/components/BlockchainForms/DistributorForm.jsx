import { useState } from 'react'
import { useContract } from '../../hooks/useContract'
import { useAuth } from '../../contexts/AuthContext'
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'
import { API_BASE_URL } from '../../lib/api'

export default function DistributorForm({ onSuccess }) {
	const { addDistributor, isConnected, connectWallet, isLoading, error } = useContract()
	const { user } = useAuth()
	const [formData, setFormData] = useState({
		batchId: '',
		cropName: '',
		distributorName: '',
		quantityReceived: '',
		purchasePrice: '',
		transportDetails: '',
		warehouseLocation: '',
		handoverDate: '',
		farmerEmail: ''
	})
	const [txHash, setTxHash] = useState('')
	const [approvalMessage, setApprovalMessage] = useState('')
	const [formError, setFormError] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleInputChange = (e) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	const handleSubmit = async (e) => {
		e.preventDefault()

		// Check if user is logged in and has an ID
		if (!user || !user.id) {
			setFormError('❌ You must be logged in as a Distributor to submit a batch. Please log in first.');
			return;
		}

		setIsSubmitting(true)
		setTxHash('')
		setApprovalMessage('')
		setFormError('')

		// Log user info and form data
		console.log('User object:', user);
		console.log('Form data being sent:', {
			batchId: formData.batchId,
			cropName: formData.cropName,
			distributorId: user.id,
			distributorName: formData.distributorName,
			quantityReceived: formData.quantityReceived,
			purchasePrice: formData.purchasePrice,
			transportDetails: formData.transportDetails,
			warehouseLocation: formData.warehouseLocation,
			handoverDate: new Date(formData.handoverDate).getTime() / 1000,
			farmerEmail: formData.farmerEmail,
			distributorTxHash: null
		});

		try {
			// ONLY send to backend for farmer approval (NO blockchain yet)
			const response = await fetch(`${API_BASE_URL}/api/approvals/submit`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					batchId: formData.batchId,
					cropName: formData.cropName,
					distributorId: user.id,
					distributorName: formData.distributorName,
					quantityReceived: formData.quantityReceived,
					purchasePrice: formData.purchasePrice,
					transportDetails: formData.transportDetails,
					warehouseLocation: formData.warehouseLocation,
					handoverDate: new Date(formData.handoverDate).getTime() / 1000,
					farmerEmail: formData.farmerEmail,
					distributorTxHash: null  // No TX yet, will be created when farmer approves
				})
			})

			const data = await response.json()

			if (!response.ok) {
				console.error('Backend error response:', data);
				setFormError(data.error + (data.missingFields ? ` (Missing: ${data.missingFields.join(', ')})` : ''));
				throw new Error(data.error || 'Failed to send for approval');
			}

			if (data.success) {
				setApprovalMessage(`✅ Submission sent to farmer (${formData.farmerEmail}) for approval. Farmer will perform the blockchain transaction when they approve.`)
				setFormData({
					batchId: '',
					cropName: '',
					distributorName: '',
					quantityReceived: '',
					purchasePrice: '',
					transportDetails: '',
					warehouseLocation: '',
					handoverDate: '',
					farmerEmail: ''
				})

				if (onSuccess) {
					onSuccess('pending')
				}
			} else {
				setFormError(data.error || 'Failed to send for approval');
				throw new Error(data.error || 'Failed to send for approval')
			}
		} catch (err) {
			console.error('Error submitting distributor form:', err)
			if (!formError) {
				setFormError('An error occurred: ' + err.message);
			}
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!isConnected) {
		return (
			<div className="bg-white rounded-lg border border-slate-200 p-6">
				<h3 className="text-xl font-semibold text-slate-900 mb-4">Submit Batch for Farmer Approval</h3>
				<p className="text-sm text-slate-600 mb-4">⚡ Batch will be submitted to blockchain only AFTER farmer approves</p>
				<div className="text-center py-8">
					<p className="text-slate-600 mb-4">MetaMask wallet connection is required for farmer approval later.</p>
					<p className="text-slate-600 text-sm">Note: You can submit now without wallet. Wallet needed when farmer approves.</p>
				</div>
			</div>
		)
	}

	return (
		<div className="bg-white rounded-lg border border-slate-200 p-6">
			<h3 className="text-xl font-semibold text-slate-900 mb-4">Submit Batch for Farmer Approval</h3>
			<p className="text-sm text-slate-600 mb-4">⚡ Batch will be submitted to blockchain only AFTER farmer approves</p>
			
		{error && (
			<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
				<FaExclamationTriangle className="text-red-500" />
				<span className="text-red-700">{error}</span>
			</div>
		)}

		{formError && (
			<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
				<FaExclamationTriangle className="text-red-500" />
				<span className="text-red-700">{formError}</span>
			</div>
		)}

		{approvalMessage && (
			<div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
				<div className="flex items-center gap-2 mb-2">
					<FaCheckCircle className="text-blue-500" />
					<p className="text-blue-700 font-medium">Submission Recorded!</p>
				</div>
				<div className="ml-6">
					<p className="text-sm text-blue-600">{approvalMessage}</p>
				</div>
			</div>
		)}			<form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Batch ID *</span>
					<input
						type="text"
						name="batchId"
						value={formData.batchId}
						onChange={handleInputChange}
						placeholder="Enter the batch ID"
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Crop Name *</span>
					<input
						type="text"
						name="cropName"
						value={formData.cropName}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Farmer Email *</span>
					<input
						type="email"
						name="farmerEmail"
						value={formData.farmerEmail}
						onChange={handleInputChange}
						placeholder="farmer@example.com"
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Distributor Name *</span>
					<input
						type="text"
						name="distributorName"
						value={formData.distributorName}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Quantity Received (kg) *</span>
					<input
						type="number"
						min="0"
						step="0.01"
						name="quantityReceived"
						value={formData.quantityReceived}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Purchase Price (₹) *</span>
					<input
						type="number"
						min="0"
						step="0.01"
						name="purchasePrice"
						value={formData.purchasePrice}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Warehouse Location *</span>
					<input
						type="text"
						name="warehouseLocation"
						value={formData.warehouseLocation}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Handover Date *</span>
					<input
						type="date"
						name="handoverDate"
						value={formData.handoverDate}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="sm:col-span-2 flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Transport Details *</span>
					<textarea
						name="transportDetails"
						value={formData.transportDetails}
						onChange={handleInputChange}
						rows="3"
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<div className="sm:col-span-2 mt-4">
					<button
						type="submit"
						disabled={isSubmitting}
						className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-secondary text-white px-4 py-2.5 font-medium hover:bg-secondary-dark disabled:opacity-60 transition-colors"
					>
						{isSubmitting ? (
							<>
								<FaSpinner className="animate-spin" />
								Sending to Farmer...
							</>
						) : (
							'Send Batch to Farmer for Approval'
						)}
					</button>
				</div>
			</form>
		</div>
	)
}
