import { useState, useEffect } from 'react'
import { useContract } from '../../hooks/useContract'
import { useAuth } from '../../contexts/AuthContext'
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'
import { API_BASE_URL } from '../../lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'https://agri-backend-2025-dxfkavfcamg0ebby.southindia-01.azurewebsites.net';

export default function DistributorForm({ onSuccess }) {
	const { addDistributor, isConnected, connectWallet, isLoading, error } = useContract()
	const { user } = useAuth()
	const [orderId, setOrderId] = useState(null)
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

	// Extract orderId from URL parameters
	useEffect(() => {
		const params = new URLSearchParams(window.location.search)
		const id = params.get('orderId')
		if (id) {
			setOrderId(id)
		}
	}, [])

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
			setFormError('❌ Authentication Error: You must be logged in as a Distributor to submit a batch. Please log in first.');
			return;
		}

		setIsSubmitting(true)
		setTxHash('')
		setApprovalMessage('')
		setFormError('')

		// Validate all required fields first
		const requiredFields = {
			'Batch ID': formData.batchId,
			'Crop Name': formData.cropName,
			'Distributor Name': formData.distributorName,
			'Quantity Received': formData.quantityReceived,
			'Purchase Price': formData.purchasePrice,
			'Farmer Email': formData.farmerEmail,
			'Handover Date': formData.handoverDate
		};

		const missingFields = Object.entries(requiredFields)
			.filter(([key, value]) => !value || value === '')
			.map(([key]) => key);

		if (missingFields.length > 0) {
			setFormError(`❌ Missing Required Fields:\n\n${missingFields.map(f => '• ' + f).join('\n')}\n\nPlease fill in all fields.`);
			setIsSubmitting(false)
			return;
		}

		// Validate numeric fields
		const quantityNum = parseFloat(formData.quantityReceived);
		const priceNum = parseFloat(formData.purchasePrice);

		if (isNaN(quantityNum) || quantityNum <= 0) {
			setFormError(`❌ Invalid Quantity!\n\nQuantity must be a positive number.\nYou entered: ${formData.quantityReceived}`);
			setIsSubmitting(false)
			return;
		}

		if (isNaN(priceNum) || priceNum <= 0) {
			setFormError(`❌ Invalid Purchase Price!\n\nPrice must be a positive number.\nYou entered: ${formData.purchasePrice}`);
			setIsSubmitting(false)
			return;
		}

		// Validate email format
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(formData.farmerEmail)) {
			setFormError(`❌ Invalid Email!\n\nPlease enter a valid email address.\nYou entered: ${formData.farmerEmail}`);
			setIsSubmitting(false)
			return;
		}

		// Log user info and form data
		console.log('User object:', user);
		console.log('Form data being sent:', {
			batchId: formData.batchId,
			cropName: formData.cropName,
			distributorId: user.id,
			distributorName: formData.distributorName,
			quantityReceived: quantityNum,
			purchasePrice: priceNum,
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
					quantityReceived: quantityNum,
					purchasePrice: priceNum,
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
				const missingFieldsMsg = data.missingFields ? `\n\nMissing fields: ${data.missingFields.join(', ')}` : '';
				setFormError(`❌ Submission Failed!\n\n${data.error || 'Failed to send for approval'}${missingFieldsMsg}\n\nPlease check all fields and try again.`);
				throw new Error(data.error || 'Failed to send for approval');
			}

			if (data.success) {
				setApprovalMessage(`✅ Submission Successful!\n\nYour batch has been sent to farmer (${formData.farmerEmail}) for approval.\n\nThe farmer will perform the blockchain transaction when they approve.\n\nExpect confirmation within 24 hours.`)
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

				// If orderId exists (from marketplace), mark the order as submitted
				if (orderId) {
					try {
						const response = await fetch(`${API_URL}/api/marketplace/orders/${orderId}/submit-to-approval`, {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' }
						});
						if (!response.ok) {
							console.warn('Warning: Could not mark marketplace order as submitted');
						}
					} catch (err) {
						console.warn('Warning: Could not update marketplace order:', err);
					}
				}

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
				setFormError(`❌ Network Error:\n\n${err.message}\n\nPlease check your connection and try again.`);
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

		{formError && (
			<div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg w-full overflow-hidden">
				<div className="flex items-start gap-3">
					<FaExclamationTriangle className="text-red-600 text-xl flex-shrink-0 mt-1" />
					<div className="flex-1 min-w-0">
						<p className="text-red-800 font-semibold mb-1">Validation Error:</p>
						<p className="text-red-700 text-sm whitespace-pre-wrap break-words overflow-hidden">{formError}</p>
					</div>
				</div>
			</div>
		)}

		{approvalMessage && (
			<div className="mb-4 p-4 bg-green-50 border-2 border-green-300 rounded-lg w-full overflow-hidden">
				<div className="flex items-start gap-3">
					<FaCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-1" />
					<div className="flex-1 min-w-0">
						<p className="text-green-800 font-semibold mb-2">Submission Recorded!</p>
						<p className="text-sm text-green-700 whitespace-pre-wrap break-words overflow-hidden">{approvalMessage}</p>
					</div>
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
