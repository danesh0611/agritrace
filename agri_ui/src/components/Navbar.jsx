import { Link, NavLink } from 'react-router-dom'
import { FaLeaf, FaUser, FaSignOutAlt } from 'react-icons/fa'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import WalletConnector from './WalletConnector'

const navLinkClass = ({ isActive }) =>
	`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
		isActive ? 'bg-primary text-white' : 'text-slate-700 hover:bg-slate-100'
	}`

export default function Navbar() {
	const { t } = useTranslation()
	const { isLoggedIn, user, logout } = useAuth()
	
	const handleLogout = () => {
		logout()
		window.location.href = '/login'
	}
	
	return (
		<header className="bg-white border-b border-slate-200 sticky top-0 z-30">
			<div className="max-w-6xl mx-auto px-4">
				<div className="flex h-16 items-center justify-between">
					<Link to="/" className="flex items-center gap-2">
						<FaLeaf className="text-primary" />
						<span className="font-semibold text-slate-800">AgriTrace</span>
					</Link>
					<div className="flex items-center gap-4">
						<nav className="flex items-center gap-1">
							<NavLink to="/" className={navLinkClass}>{t('home')}</NavLink>
							{isLoggedIn ? (
								<>
									<NavLink to="/dashboard" className={navLinkClass}>{t('dashboard.title')}</NavLink>
									<NavLink to="/blockchain" className={navLinkClass}>Blockchain</NavLink>
									<NavLink to="/marketplace" className={navLinkClass}>Marketplace</NavLink>
									<NavLink to="/qr" className={navLinkClass}>{t('qrGenerator.title')}</NavLink>
								</>
							) : (
								<>
									<NavLink to="/login" className={navLinkClass}>{t('login.loginButton')}</NavLink>
									<NavLink to="/signup" className={navLinkClass}>{t('signup.signupButton')}</NavLink>
								</>
							)}
						</nav>
						
						{/* Wallet Connector */}
						<WalletConnector />
						
						{isLoggedIn && user && (
							<div className="flex items-center gap-3 pl-4 border-l border-slate-200">
								<div className="flex items-center gap-2 text-sm text-slate-700">
									<FaUser className="text-slate-500" />
									<span className="hidden sm:inline">{user.username}{user.role ? ` (${user.role})` : ''}</span>
								</div>
								<button
									onClick={handleLogout}
									className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
									title={t('dashboard.logout')}
								>
									<FaSignOutAlt />
									<span className="hidden sm:inline">{t('dashboard.logout')}</span>
								</button>
							</div>
						)}
						
						<LanguageSwitcher />
					</div>
				</div>
			</div>
		</header>
	)
}