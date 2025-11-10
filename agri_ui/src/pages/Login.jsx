import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { postJson } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
	const { t } = useTranslation()
	const navigate = useNavigate()
	const { login } = useAuth()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [loading, setLoading] = useState(false)
	const [message, setMessage] = useState(null)
	const [error, setError] = useState(null)

	async function handleSubmit(e) {
		e.preventDefault()
		setLoading(true)
		setError(null)
		setMessage(null)
		const payload = { email, password };
		const res = await postJson(payload, 'login');
		setLoading(false);
		if (res.ok && res.data && res.data.success) {
			// Use the role from the backend user data
			login({
				id: res.data.user.id,
				username: res.data.user.username,
				email: res.data.user.email,
				role: res.data.user.role // Use backend role, not frontend selection
			});
			setMessage(t('login.successMessage'));
			setTimeout(() => navigate('/dashboard'), 600);
		} else {
			setError(`${t('login.loginFailed')} (status ${res.status})`);
		}
	}

	return (
		<section className="min-h-[70vh] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md bg-white rounded-xl shadow-sm border border-slate-200 p-6">
				<h2 className="text-xl font-semibold text-slate-900">{t('login.title')}</h2>
				<p className="mt-1 text-sm text-slate-600">{t('login.subtitle')}</p>

				{message && <div className="mt-4 rounded-md bg-green-50 text-green-700 px-3 py-2 text-sm">{message}</div>}
				{error && <div className="mt-4 rounded-md bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>}

				<form className="mt-6 space-y-4" onSubmit={handleSubmit}>
					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">{t('login.email')}</label>
						<input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary" placeholder={t('login.emailPlaceholder')} />
					</div>

					<div>
						<label className="block text-sm font-medium text-slate-700 mb-1">{t('login.password')}</label>
						<input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-700 focus:outline-none focus:ring-2 focus:ring-secondary" placeholder={t('login.passwordPlaceholder')} />
					</div>

					<button disabled={loading} type="submit" className="w-full inline-flex items-center justify-center rounded-md bg-primary text-white px-4 py-2.5 font-medium hover:bg-primary-dark transition transform hover:-translate-y-0.5 disabled:opacity-60">
						{loading ? t('login.loggingIn') : t('login.loginButton')}
					</button>
				</form>

				<p className="mt-4 text-sm text-slate-600">{t('login.newUser')} <Link to="/signup" className="text-secondary hover:underline">{t('login.createAccount')}</Link></p>
			</div>
		</section>
	)
}