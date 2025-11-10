import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useContract } from '../hooks/useContract'
import FarmerForm from '../components/BlockchainForms/FarmerForm'
import DistributorForm from '../components/BlockchainForms/DistributorForm'
import RetailerForm from '../components/BlockchainForms/RetailerForm'
import ProduceDisplay from '../components/ProduceDisplay'
import { FaLeaf, FaUser, FaSignOutAlt, FaWallet, FaToggleOn, FaToggleOff } from 'react-icons/fa'

export default function BlockchainDashboard() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { isLoggedIn, user, logout, isLoading } = useAuth()
	const { isConnected, account, connectWallet, isLoading: walletLoading } = useContract()
	
	const [useBlockchain, setUseBlockchain] = useState(true)
	const [recentTransactions, setRecentTransactions] = useState([])
	const [refreshTrigger, setRefreshTrigger] = useState(0)

	useEffect(() => {
		if (!isLoading && !isLoggedIn) {
			navigate('/login')
			return
		}
	}, [isLoggedIn, isLoading, navigate])

	const handleLogout = () => {
		logout()
		navigate('/login')
	}

	const role = user?.role || 'farmer'

	const handleTransactionSuccess = (txHash) => {
		setRecentTransactions(prev => [
			{
				id: Date.now(),
				hash: txHash,
				role: role,
				timestamp: new Date().toISOString()
			},
			...prev
		])
		
		// Trigger refresh of blockchain data
		setRefreshTrigger(prev => prev + 1)
	}

	if (isLoading) {
		return (
			<div className="min-h-[70vh] flex items-center justify-center">
				<div className="text-center">
					<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
					<p className="mt-2 text-slate-600">{t('dashboard.loading')}</p>
				</div>
			</div>
		)
	}

	if (!user) {
		return null
	}

	return (
		<section className="min-h-[70vh] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-6xl bg-white rounded-xl shadow-sm border border-slate-200 p-8">
				{/* Header */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-slate-900 mb-2">
						{t('dashboard.welcome')}, {user.username}!
					</h1>
					<p className="text-slate-600">Blockchain-powered agricultural supply chain tracking</p>
				</div>

				{/* User Info Card */}
				<div className="bg-slate-50 rounded-lg p-6 mb-6">
					<h2 className="text-lg font-semibold text-slate-900 mb-4">{t('dashboard.userInfo')}</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
						<div className="space-y-3">
							<div className="flex justify-between items-center py-2 border-b border-slate-200">
								<span className="font-medium text-slate-700">{t('dashboard.username')}:</span>
								<span className="text-slate-900">{user.username}</span>
							</div>
							<div className="flex justify-between items-center py-2 border-b border-slate-200">
								<span className="font-medium text-slate-700">Role:</span>
								<span className="text-slate-900 capitalize">{user.role}</span>
							</div>
						</div>
						<div className="space-y-3">
							<div className="flex justify-between items-center py-2 border-b border-slate-200">
								<span className="font-medium text-slate-700">Wallet Status:</span>
								<div className="flex items-center gap-2">
									{isConnected ? (
										<>
											<FaWallet className="text-green-600" />
											<span className="text-green-700 text-sm">{account?.slice(0, 6)}...{account?.slice(-4)}</span>
										</>
									) : (
										<>
											<FaWallet className="text-red-600" />
											<span className="text-red-700 text-sm">Not Connected</span>
										</>
									)}
								</div>
							</div>
							<div className="flex justify-between items-center py-2">
								<span className="font-medium text-slate-700">Mode:</span>
								<div className="flex items-center gap-2">
									<button
										onClick={() => setUseBlockchain(!useBlockchain)}
										className="flex items-center gap-2 text-sm"
									>
										{useBlockchain ? <FaToggleOn className="text-primary" /> : <FaToggleOff className="text-gray-400" />}
										<span className={useBlockchain ? 'text-primary' : 'text-gray-500'}>
											{useBlockchain ? 'Blockchain' : 'Local'}
										</span>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
					<button
						onClick={handleLogout}
						className="inline-flex items-center justify-center gap-2 rounded-md bg-red-600 text-white px-6 py-3 font-medium hover:bg-red-700 transition transform hover:-translate-y-0.5"
					>
						<FaSignOutAlt />
						{t('dashboard.logout')}
					</button>
					<button
						onClick={() => navigate('/qr')}
						className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-white px-6 py-3 font-medium hover:bg-primary-dark transition transform hover:-translate-y-0.5"
					>
						<FaLeaf />
						{t('dashboard.generateQR')}
					</button>
					{!isConnected && (
						<button
							onClick={connectWallet}
							disabled={walletLoading}
							className="inline-flex items-center justify-center gap-2 rounded-md bg-secondary text-white px-6 py-3 font-medium hover:bg-secondary-dark disabled:opacity-60 transition transform hover:-translate-y-0.5"
						>
							<FaWallet />
							{walletLoading ? 'Connecting...' : 'Connect Wallet'}
						</button>
					)}
				</div>

				{/* Blockchain Mode Forms */}
				{useBlockchain && (
					<div className="space-y-8">
						{/* Role-specific blockchain form */}
						{role === 'farmer' && (
							<FarmerForm onSuccess={handleTransactionSuccess} />
						)}
						{(role === 'transporter' || role === 'distributor') && (
							<DistributorForm onSuccess={handleTransactionSuccess} />
						)}
						{role === 'retailer' && (
							<RetailerForm onSuccess={handleTransactionSuccess} />
						)}

						{/* Produce Display */}
						<ProduceDisplay key={refreshTrigger} recentTransactions={recentTransactions} />
					</div>
				)}

				{/* Local Mode Warning */}
				{!useBlockchain && (
					<div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
						<h3 className="text-lg font-semibold text-yellow-800 mb-2">Local Mode Disabled</h3>
						<p className="text-yellow-700 mb-4">
							To use blockchain features, please enable blockchain mode and connect your MetaMask wallet.
						</p>
						<button
							onClick={() => setUseBlockchain(true)}
							className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-yellow-600 text-white font-medium hover:bg-yellow-700 transition-colors"
						>
							<FaToggleOn />
							Enable Blockchain Mode
						</button>
					</div>
				)}

				{/* Recent Transactions */}
				{recentTransactions.length > 0 && (
					<div className="bg-slate-50 rounded-lg p-6 mt-8">
						<h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Transactions</h3>
						<div className="space-y-2">
							{recentTransactions.slice(0, 5).map(tx => (
								<div key={tx.id} className="p-3 bg-white rounded-md border border-slate-200">
									<div className="flex items-center justify-between mb-2">
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 bg-green-500 rounded-full"></div>
											<span className="text-sm text-slate-700 capitalize">{tx.role} transaction</span>
										</div>
									</div>
									<div className="flex items-center gap-2">
										<div className="flex-1">
											<span className="text-xs text-slate-500 block mb-1">Batch ID:</span>
											<div className="bg-slate-100 rounded px-2 py-1 font-mono text-sm text-slate-800 break-all">
												{tx.hash}
											</div>
										</div>
										<button
											onClick={() => {
												navigator.clipboard.writeText(tx.hash)
												// You could add a toast notification here
											}}
											className="px-3 py-1 text-xs bg-primary text-white rounded hover:bg-primary-dark transition-colors"
											title="Copy Batch ID"
										>
											Copy
										</button>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</section>
	)
}
