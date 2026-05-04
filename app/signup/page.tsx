'use client'
import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Shield, Mail, Lock, ArrowRight, AlertCircle, User, CheckCircle2, XCircle } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  // Real-time Validation
  const [validations, setValidations] = useState({
    name: false,
    email: false,
    passLength: false,
    passUpper: false,
    passNumber: false,
    passSymbol: false,
  })

  useEffect(() => {
    setValidations({
      name: name.trim().length >= 3,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      passLength: password.length >= 8,
      passUpper: /[A-Z]/.test(password),
      passNumber: /[0-9]/.test(password),
      passSymbol: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
  }, [name, email, password])

  const isFormValid = Object.values(validations).every(Boolean)

  // ── Email/Password Signup ─────────────────────────────────────
  const handleSignup = async () => {
    if (!isFormValid) {
      setError('Security protocols not met. Verify all fields.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Registration failed.')
      } else {
        // Account bana — login page pe bhejo success message ke saath
        router.push('/login?message=Account established. Please sign in.')
      }
    } catch (err) {
      setError('Connection timeout. Link unstable.')
    } finally {
      setLoading(false)
    }
  }

  // ── Google Signup/Login ──────────────────────────────────────
  // Google se signup aur login same flow hai — account auto-create hota hai
  const handleGoogleSignup = () => {
    setGoogleLoading(true)
    signIn('google', { callbackUrl: '/dashboard' })
  }

  // Validation item component
  const ValidationItem = ({ isMet, text }: { isMet: boolean; text: string }) => (
    <div className={`flex items-center gap-2 text-[10px] uppercase tracking-tighter ${isMet ? 'text-green-500' : 'text-gray-600'}`}>
      {isMet ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      <span>{text}</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row font-mono text-gray-300 selection:bg-green-500/30">

      {/* Left Side: Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-md space-y-6">

          {/* Header */}
          <div className="space-y-2">
            <div className="inline-block p-3 rounded-xl bg-green-500/10 border border-green-500/20 mb-2 animate-pulse">
              <Shield className="w-8 h-8 text-green-500" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-white uppercase italic">Create Identity</h1>
            <p className="text-xs tracking-[0.2em] text-gray-500 uppercase">Register Operative // Crypto Sentry v2.0</p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border-l-4 border-red-500 text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">

            {/* Name Field */}
            <div className="group space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-green-500 transition-colors">
                  Full Name
                </label>
                {name && <ValidationItem isMet={validations.name} text="Min 3 Chars" />}
              </div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Muhammad Tayyab"
                  className={`w-full bg-[#0a0a0a] border ${
                    name && !validations.name ? 'border-red-500/50' : 'border-white/10'
                  } rounded-lg px-12 py-4 text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-gray-700`}
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="group space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-green-500 transition-colors">
                  Email Identifier
                </label>
                {email && <ValidationItem isMet={validations.email} text="Valid Format" />}
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
              <label className="text-[10px] uppercase tracking-widest text-gray-500 group-focus-within:text-green-500 transition-colors">
                Create Passkey
              </label>
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
              {/* Password Strength Checklist */}
              <div className="grid grid-cols-2 gap-2 mt-2 p-3 bg-white/5 rounded-lg border border-white/5">
                <ValidationItem isMet={validations.passLength} text="8+ Characters" />
                <ValidationItem isMet={validations.passUpper} text="Uppercase" />
                <ValidationItem isMet={validations.passNumber} text="Number" />
                <ValidationItem isMet={validations.passSymbol} text="Symbol (!@#)" />
              </div>
            </div>

            {/* Signup Button */}
            <button
              onClick={handleSignup}
              disabled={loading || !isFormValid}
              className="group relative w-full bg-green-500 hover:bg-green-400 text-black font-bold py-4 rounded-lg transition-all flex items-center justify-center gap-2 overflow-hidden disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <span className="relative z-10 uppercase tracking-tighter">
                {loading ? 'Encrypting Data...' : 'Confirm Registration'}
              </span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-2">
              <div className="grow border-t border-white/5"></div>
              <span className="shrink mx-4 text-[10px] text-gray-600 uppercase tracking-widest">or register with</span>
              <div className="grow border-t border-white/5"></div>
            </div>

            {/* Google Signup Button */}
            <button
              onClick={handleGoogleSignup}
              disabled={googleLoading}
              className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-4 rounded-lg transition-all flex items-center justify-center gap-3 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-sm">
                {googleLoading ? 'Redirecting...' : 'Sign up with Google'}
              </span>
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-600">
            Already Registered?{' '}
            <a href="/login" className="text-green-500 hover:text-green-400 hover:underline transition-colors uppercase tracking-widest ml-1">
              Return to Login
            </a>
          </p>
        </div>
      </div>

      {/* Right Side: Decorative */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-[#080808] border-l border-white/5">
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)', backgroundSize: '30px 30px' }}
        />
        <div className="relative z-20 w-full h-full flex flex-col justify-end p-12 space-y-6">
          <div className="space-y-2">
            <span className="text-green-500 text-[10px] font-bold tracking-[0.3em] uppercase">Recruitment Open</span>
            <h2 className="text-4xl font-bold text-white leading-tight uppercase italic">
              Join the Guard <br /> Secure the Pulse //
            </h2>
            <p className="max-w-md text-gray-500 text-sm leading-relaxed">
              By registering, you gain access to high-fidelity liquidity signals and institutional grade security monitoring tools.
            </p>
          </div>
          <div className="flex gap-8 border-t border-white/10 pt-8 text-white font-bold">
            <div><p className="text-[10px] text-gray-600 uppercase mb-1">Status</p>Open</div>
            <div><p className="text-[10px] text-gray-600 uppercase mb-1">Region</p>Global</div>
            <div><p className="text-[10px] text-gray-600 uppercase mb-1">Auth</p>AES-256</div>
          </div>
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/5 rounded-full blur-[120px]" />
      </div>
    </div>
  )
}


// Terminal mein:
// npm run dev

// Browser mein jao:
// http://localhost:3000/signup