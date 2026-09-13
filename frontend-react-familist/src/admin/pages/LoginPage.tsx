import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { apiErrorMessage } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import { adminApi } from '../api/adminApi'
import { ErrorNote, inputCls } from '../components/ui'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const token = useAuthStore((s) => s.token)
  const role = useAuthStore((s) => s.user?.role)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (token && role === 'admin') return <Navigate to="/admin" replace />

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      const res = await adminApi.login(email, password)
      if (res.user.role !== 'admin') {
        setError('This account does not have admin access.')
        return
      }
      setAuth(res.token, res.user)
      navigate('/admin', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Sign-in failed'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <form onSubmit={onSubmit} className="w-full max-w-[400px] rounded-[12px] border border-stone bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center border-[1.5px] border-navy font-serif text-[1.5rem] italic text-navy">F</span>
          <h1 className="font-serif text-[1.6rem] text-navy">Familist Admin</h1>
          <p className="mt-1 text-[0.88rem] text-muted">Sign in to manage your website</p>
        </div>
        <ErrorNote message={error} />
        <label className="mb-4 block">
          <span className="mb-1 block text-[0.82rem] font-semibold text-navy">Email</span>
          <input className={inputCls} type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label className="mb-6 block">
          <span className="mb-1 block text-[0.82rem] font-semibold text-navy">Password</span>
          <input className={inputCls} type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button type="submit" disabled={busy} className="w-full rounded-btn bg-navy py-2.5 font-semibold text-white hover:bg-gold hover:text-navy disabled:opacity-60">
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-5 text-center text-[0.82rem]">
          <a href="/" className="text-muted hover:text-navy">← Back to website</a>
        </p>
      </form>
    </div>
  )
}
