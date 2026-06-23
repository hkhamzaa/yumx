'use client'

import { useState, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Step = 'email' | 'otp'

function ForgotPasswordForm() {
  const router = useRouter()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  // ── Step 1: request OTP ───────────────────────────────────────────────────
  async function handleRequestOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const json = (await res.json()) as { success: boolean }
      if (json.success) {
        setInfo('If an account with that email exists, a 6-digit code has been sent.')
        setStep('otp')
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  // ── Step 2: verify OTP + set new password ────────────────────────────────
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (otp.length !== 6 || !/^\d+$/.test(otp)) { setError('Enter the 6-digit code from your email'); return }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters'); return }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return }
    setLoading(true)

    try {
      const res = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp, newPassword }),
      })
      const json = (await res.json()) as { success: boolean; error?: string }

      if (json.success) {
        router.push('/login?reset=1')
      } else {
        setError(json.error ?? 'Invalid or expired code. Please try again.')
      }
    } catch {
      setError('Network error. Please check your connection.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full bg-brand-bg border border-brand-border rounded-xl px-4 py-3 font-body text-sm text-brand-text placeholder:text-brand-dim focus:outline-none focus:border-brand-accent transition-colors min-h-[48px]"
  const labelClass = "font-body text-xs font-semibold text-brand-muted uppercase tracking-wide block mb-1.5"

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md">

        {/* Logo */}
        <Link href="/" className="block text-center mb-8">
          <span className="font-display font-black text-3xl tracking-widest text-brand-text">
            YUM <span className="text-brand-accent">X</span>
          </span>
        </Link>

        {/* Card */}
        <div className="bg-brand-surface rounded-2xl border border-brand-border p-6 sm:p-8">
          <h1 className="font-display font-bold text-xl text-brand-text uppercase mb-1">
            {step === 'email' ? 'Forgot Password?' : 'Enter Reset Code'}
          </h1>
          <p className="font-body text-sm text-brand-muted mb-6">
            {step === 'email'
              ? 'Enter your account email. If it\'s registered, we\'ll send you a code.'
              : `Check your inbox at ${email} for a 6-digit code.`}
          </p>

          {/* Progress dots */}
          <div className="flex gap-2 mb-6">
            <div className="h-1 flex-1 rounded-full bg-brand-accent" />
            <div className={`h-1 flex-1 rounded-full transition-colors ${step === 'otp' ? 'bg-brand-accent' : 'bg-brand-border'}`} />
          </div>

          {info && step === 'otp' && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3 mb-5">
              <p className="font-body text-sm text-green-400">{info}</p>
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleRequestOtp} className="space-y-4" noValidate>
              <div>
                <label htmlFor="email" className={labelClass}>Email *</label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="ali@example.com" required autoComplete="email"
                  className={inputClass} />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="font-body text-sm text-red-400">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className={`w-full font-body font-bold text-base py-4 rounded-full transition-all min-h-[52px] flex items-center justify-center gap-2 ${loading ? 'bg-brand-border text-brand-dim cursor-not-allowed' : 'bg-brand-accent text-brand-bg hover:bg-white active:scale-[0.98]'}`}>
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Sending…' : 'Send Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
              <div>
                <label htmlFor="otp" className={labelClass}>6-Digit Code *</label>
                <input id="otp" type="text" inputMode="numeric" pattern="\d{6}" maxLength={6}
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456" required autoComplete="one-time-code"
                  className={`${inputClass} text-center text-2xl tracking-[0.4em] font-display font-bold`} />
                <p className="font-body text-xs text-brand-dim mt-1.5">Expires in 10 minutes</p>
              </div>

              <div>
                <label htmlFor="new-password" className={labelClass}>New Password *</label>
                <input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8} autoComplete="new-password"
                  className={inputClass} />
              </div>

              <div>
                <label htmlFor="confirm-password" className={labelClass}>Confirm Password *</label>
                <input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password" required autoComplete="new-password"
                  className={inputClass} />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <p className="font-body text-sm text-red-400">{error}</p>
                </div>
              )}

              <button type="submit" disabled={loading}
                className={`w-full font-body font-bold text-base py-4 rounded-full transition-all min-h-[52px] flex items-center justify-center gap-2 ${loading ? 'bg-brand-border text-brand-dim cursor-not-allowed' : 'bg-brand-accent text-brand-bg hover:bg-white active:scale-[0.98]'}`}>
                {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                {loading ? 'Updating…' : 'Set New Password'}
              </button>

              <button type="button" onClick={() => { setStep('email'); setOtp(''); setNewPassword(''); setConfirmPassword(''); setError(null) }}
                className="w-full font-body text-xs text-brand-dim hover:text-brand-accent transition-colors py-1">
                ← Try a different email
              </button>
            </form>
          )}
        </div>

        <p className="font-body text-xs text-brand-dim text-center mt-6">
          <Link href="/login" className="hover:text-brand-accent transition-colors">← Back to Sign In</Link>
        </p>
      </div>
    </div>
  )
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordForm />
    </Suspense>
  )
}
