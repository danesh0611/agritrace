import { useState } from 'react'
import { useContract } from '../../hooks/useContract'
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa'

export default function FarmerForm({ onSuccess }) {
	const { createProduce, isConnected, connectWallet, isLoading, error } = useContract()
	const [formData, setFormData] = useState({
		farmerName: '',
		cropName: '',
		quantity: '',
		pricePerKg: '',
		location: '',
		expiryDate: ''
	})
	const [txHash, setTxHash] = useState('')
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
		
		if (!isConnected) {
			await connectWallet()
			return
		}

		setIsSubmitting(true)
		setTxHash('')

		try {
			const hash = await createProduce(
				formData.farmerName,
				formData.cropName,
				parseFloat(formData.quantity),
				parseFloat(formData.pricePerKg),
				formData.location,
				formData.expiryDate ? Math.floor(new Date(formData.expiryDate).getTime() / 1000) : undefined
			)

			setTxHash(hash)
			setFormData({
				farmerName: '',
				cropName: '',
				quantity: '',
				pricePerKg: '',
				location: '',
				expiryDate: ''
			})

			if (onSuccess) {
				onSuccess(hash)
			}
		} catch (err) {
			console.error('Error submitting farmer form:', err)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!isConnected) {
		return (
			<div className="bg-white rounded-lg border border-slate-200 p-6">
				<h3 className="text-xl font-semibold text-slate-900 mb-4">Farmer Entry (Blockchain)</h3>
				<div className="text-center py-8">
					<FaExclamationTriangle className="mx-auto text-yellow-500 text-3xl mb-4" />
					<p className="text-slate-600 mb-4">Connect your MetaMask wallet to create produce on the blockchain</p>
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
		<div className="bg-white rounded-lg border border-slate-200 p-6">
			<h3 className="text-xl font-semibold text-slate-900 mb-4">Farmer Entry (Blockchain)</h3>
			
			{error && (
				<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
					<FaExclamationTriangle className="text-red-500" />
					<span className="text-red-700">{error}</span>
				</div>
			)}

			{txHash && (
				<div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
					<div className="flex items-center gap-2 mb-2">
						<FaCheckCircle className="text-green-500" />
						<p className="text-green-700 font-medium">Produce created successfully!</p>
					</div>
					<div className="ml-6">
						<span className="text-xs text-green-600 block mb-1">Batch ID (Copy this for distributors):</span>
						<div className="flex items-center gap-2">
							<div className="bg-white rounded px-2 py-1 font-mono text-sm text-green-800 break-all flex-1">
								{txHash}
							</div>
							<button
								onClick={() => {
									navigator.clipboard.writeText(txHash)
								}}
								className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
								title="Copy Batch ID"
							>
								Copy
							</button>
						</div>
					</div>
				</div>
			)}

			<form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Farmer Name *</span>
					<input
						type="text"
						name="farmerName"
						value={formData.farmerName}
						onChange={handleInputChange}
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
					<span className="mb-1 text-slate-700">Quantity (kg) *</span>
					<input
						type="number"
						min="0"
						step="0.01"
						name="quantity"
						value={formData.quantity}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Price per kg (₹) *</span>
					<input
						type="number"
						min="0"
						step="0.01"
						name="pricePerKg"
						value={formData.pricePerKg}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="sm:col-span-2 flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Location *</span>
					<input
						type="text"
						name="location"
						value={formData.location}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
						required
					/>
				</label>

				<label className="sm:col-span-2 flex flex-col text-sm">
					<span className="mb-1 text-slate-700">Expiry Date (Optional)</span>
					<input
						type="date"
						name="expiryDate"
						value={formData.expiryDate}
						onChange={handleInputChange}
						className="rounded-md border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
					/>
				</label>

				<div className="sm:col-span-2 mt-4">
					<button
						type="submit"
						disabled={isSubmitting || isLoading}
						className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-secondary text-white px-4 py-2.5 font-medium hover:bg-secondary-dark disabled:opacity-60 transition-colors"
					>
						{isSubmitting ? (
							<>
								<FaSpinner className="animate-spin" />
								Creating Produce...
							</>
						) : (
							'Create Produce on Blockchain'
						)}
					</button>
				</div>
			</form>
		</div>
	)
}
