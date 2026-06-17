import { useState, useEffect, useCallback } from 'react'
import { Eye, EyeOff, RefreshCw, LogIn } from 'lucide-react'

const genCaptcha = () => {
  const a = Math.floor(Math.random() * 9) + 1
  const b = Math.floor(Math.random() * 9) + 1
  return { question: `${a} + ${b}`, answer: String(a + b) }
}

export default function LoginPage({ onLogin }) {
  const [username,  setUsername]  = useState('')
  const [password,  setPassword]  = useState('')
  const [showPwd,   setShowPwd]   = useState(false)
  const [captcha,   setCaptcha]   = useState(genCaptcha)
  const [captchaIn, setCaptchaIn] = useState('')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  const refresh = useCallback(() => {
    setCaptcha(genCaptcha())
    setCaptchaIn('')
  }, [])

  useEffect(() => { refresh() }, [])

  const handleLogin = async e => {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Email and password are required')
      return
    }
    if (captchaIn.trim() !== captcha.answer) {
      setError('Incorrect CAPTCHA answer')
      refresh()
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username.trim(), password }),
      })
      const data = await response.json()
      if (response.ok) {
        onLogin(data)
      } else {
        setError(data.error || 'Login failed')
        refresh()
      }
    } catch {
      setError('Error connecting to server')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#1a3a5c] via-[#1e4d78] to-[#0097A7] relative overflow-hidden">
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 rounded-full bg-white/5" />
      <div className="absolute bottom-[-60px] right-[-60px] w-96 h-96 rounded-full bg-white/5" />
      <div className="absolute top-1/3 right-[-40px] w-48 h-48 rounded-full bg-[#0097A7]/20" />

      {/* Logo */}
      <div className="flex items-center gap-3 mb-8 z-10">
        <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden">
          <img src="/velson-logo.png" alt="Velson" className="w-12 h-12 object-contain"
            onError={e => { e.currentTarget.style.display='none'; e.currentTarget.nextSibling.style.display='flex' }} />
          <span className="hidden w-full h-full items-center justify-center text-[#1a3a5c] font-black text-lg">V</span>
        </div>
        <div>
          <div className="text-white font-black text-2xl tracking-wide leading-tight">VELSON</div>
          <div className="text-[#7dd3fc] text-[11px] font-semibold tracking-widest uppercase">Stock Management System</div>
        </div>
      </div>

      {/* Card */}
      <div className="z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a3a5c] to-[#0097A7] px-6 py-4">
          <h2 className="text-white font-bold text-[15px] uppercase tracking-widest text-center">User Login</h2>
        </div>

        <form onSubmit={handleLogin} className="px-7 py-6 space-y-4">
          {error && (
            <div className="text-[12px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center font-medium">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Email</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter email"
              autoComplete="username"
              className="w-full px-3 py-2.5 text-[13px] border border-slate-300 rounded-lg bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7] focus:border-transparent transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full px-3 py-2.5 pr-10 text-[13px] border border-slate-300 rounded-lg bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7] focus:border-transparent transition-all"
              />
              <button type="button" onClick={() => setShowPwd(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* CAPTCHA */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">CAPTCHA Verification</label>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center gap-2 bg-slate-100 border border-slate-300 rounded-lg px-4 py-2.5 min-w-[110px] select-none">
                <span className="text-[17px] font-black text-slate-700 tracking-widest font-mono"
                  style={{ letterSpacing: '0.15em', textShadow: '1px 1px 0 #94a3b8' }}>
                  {captcha.question} = ?
                </span>
              </div>
              <button type="button" onClick={refresh}
                className="text-slate-400 hover:text-[#0097A7] transition-colors" title="Refresh CAPTCHA">
                <RefreshCw size={16} />
              </button>
              <input
                type="text"
                value={captchaIn}
                onChange={e => setCaptchaIn(e.target.value)}
                placeholder="Answer"
                maxLength={4}
                className="flex-1 px-3 py-2.5 text-[13px] border border-slate-300 rounded-lg bg-slate-50 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0097A7] focus:border-transparent transition-all text-center font-bold"
              />
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-[#1a3a5c] to-[#0097A7] hover:from-[#1e4d78] hover:to-[#007a87] disabled:opacity-60 text-white text-[13px] font-bold rounded-lg shadow-md transition-all active:scale-[0.98] mt-2">
            <LogIn size={16} /> {loading ? 'Logging in...' : 'Login'}
          </button>

          <p className="text-center text-[10px] text-slate-400 pt-1">
            Default: <span className="font-bold text-slate-500">admin@admin.com / password123</span>
          </p>
        </form>
      </div>

      <p className="z-10 mt-6 text-[11px] text-white/40">© 2026 Velson Stock Management System</p>
    </div>
  )
}
