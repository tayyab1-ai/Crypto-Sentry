'use client'
import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Shield, Mail, Lock, ArrowRight, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

// useSearchParams ko Suspense ke andar wrap karna zaroori hai
function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // Signup ke baad redirect message
  useEffect(() => {
    const msg = searchParams.get('message')
    if (msg) setSuccessMsg(msg)
  }, [searchParams])

  // Real-time Validation
  const [validations, setValidations] = useState({
    email: false,
    password: false,
  })

  useEffect(() => {
    setValidations({
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      password: password.length > 0,
    })
  }, [email, password])

  const isFormValid = validations.email && validations.password

  // ── Credentials Login ────────────────────────────────────────
  const handleLogin = async () => {
    if (!isFormValid) {
      setError('Input protocols failed. Check identifier and passkey.')
      return
    }

    setLoading(true)
    setError('')
    setSuccessMsg('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false, // Manually redirect karenge
      })

      if (result?.error) {
        setError('Authorization failed. Invalid credentials.')
      } else if (result?.ok) {
        // Login successful — dashboard pe bhejo
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('System breach or network instability detected.')
    } finally {
      setLoading(false)
    }
  }

  // ── Google Login ─────────────────────────────────────────────
  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' })
  }

  // Enter key support
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleLogin()
  }

  const StatusIndicator = ({ isMet, visible }: { isMet: boolean; visible: boolean }) => {
    if (!visible) return null
    return isMet ? (
      <CheckCircle2 className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  return (
    <div className="w-full max-w-md space-y-8">

      {/* Header */}
      <div className="space-y-2">
        <div className="inline-block p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-4 animate-pulse">
          <Shield className="w-8 h-8 text-green-500" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">
          Access Terminal
        </h1>
        <p className="text-xs tracking-[0.2em] text-gray-500 uppercase">
          Establish Secure Link // Crypto Sentry v2.0
        </p>
      </div>

      {/* Success Message (signup ke baad) */}
      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-500/10 border-l-4 border-green-500 text-green-400 text-sm">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-5" onKeyDown={handleKeyDown}>

        {/* Email Field */}
        <div className="group space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-green-500 transition-colors">
              Email Identifier
            </label>
            <StatusIndicator isMet={validations.email} visible={email.length > 0} />
          </div>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tayyab@gmail.com"
              className={`w-full bg-[#0a0a0a] border ${
                email && !validations.email ? 'border-red-500/50' : 'border-white/10'
              } rounded-lg px-12 py-4 text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-gray-700`}
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="group space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-green-500 transition-colors">
              Password
            </label>
            <StatusIndicator isMet={validations.password} visible={password.length > 0} />
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg px-12 py-4 text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-gray-700"
            />
          </div>
        </div>

        {/* Login Button */}
        <button
          onClick={handleLogin}
          disabled={loading || !isFormValid}
          className="group relative w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <span className="relative z-10 uppercase tracking-tighter">
            {loading ? 'Authenticating...' : 'Initiate Login'}
          </span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        </button>

        {/* Divider */}
        <div className="relative flex items-center py-2">
          <div className="grow border-t border-white/5"></div>
          <span className="shrink mx-4 text-[10px] text-gray-600 uppercase tracking-widest">or SignIn with</span>
          <div className="grow border-t border-white/5"></div>
        </div>

        {/* Google Login Button */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 rounded-lg transition-all flex items-center justify-center gap-3 group"
        >
          <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span className="text-sm">Sign in with Google</span>
        </button>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-gray-600">
        No Account?{' '}
        <a href="/signup" className="text-green-500 hover:text-green-400 hover:underline transition-colors uppercase tracking-widest ml-1">
          Request Access
        </a>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row font-mono text-gray-300 selection:bg-green-500/30">

      {/* Left Side: Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        {/* Suspense zaroor chahiye useSearchParams ke liye */}
        <Suspense fallback={<div className="text-gray-500 text-sm">Loading...</div>}>
          <LoginForm />
        </Suspense>
      </div>

      {/* Right Side: Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#080808] border-l border-white/5">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        <div className="relative z-20 w-full h-full flex flex-col justify-end p-12 space-y-6">
          <div className="space-y-2">
            <span className="text-green-500 text-[10px] font-bold tracking-[0.3em] uppercase">Protocol Active</span>
            <h2 className="text-4xl font-bold text-white leading-tight uppercase italic">
              Secure Asset <br /> Monitoring //
            </h2>
            <p className="max-w-md text-gray-500 text-sm leading-relaxed">
              Join the network of thousands of operatives monitoring the global liquidity deltas in real-time. Encryption enabled.
            </p>
          </div>
          <div className="flex gap-8 border-t border-white/10 pt-8 text-white font-bold">
            <div><p className="text-[10px] text-gray-600 uppercase mb-1">Uptime</p>99.99%</div>
            <div><p className="text-[10px] text-gray-600 uppercase mb-1">Latency</p>14ms</div>
            <div><p className="text-[10px] text-gray-600 uppercase mb-1">Encryption</p>AES-256</div>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  )
}
