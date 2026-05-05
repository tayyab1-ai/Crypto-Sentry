// PATH: ask-ai/app/settings/SettingsClient.tsx

'use client'
import { useState } from 'react'
import { signOut } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

interface Props {
  user: {
    name: string
    email: string
    hasPassword: boolean
  }
}

// ─── Reusable UI pieces ───────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="text-[9px] tracking-widest font-bold mb-4"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </div>
  )
}

function Row({
  label,
  sublabel,
  children,
}: {
  label: string
  sublabel?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between py-3"
      style={{ borderBottom: '1px solid var(--border-default)' }}
    >
      <div>
        <div className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
          {label}
        </div>
        {sublabel && (
          <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {sublabel}
          </div>
        )}
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  )
}

// Toggle switch component
function Toggle({
  value,
  onChange,
}: {
  value: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="relative w-10 h-5 rounded-full transition-all duration-200 shrink-0"
      style={{
        background: value ? 'var(--green-bright)' : 'var(--border-default)',
      }}
    >
      <span
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
        style={{
          background: '#fff',
          left: value ? '22px' : '2px',
        }}
      />
    </button>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function SettingsClient({ user }: Props) {
  // Toast
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  // ── Password change state ────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState({
    current: '',
    newPw: '',
    confirm: '',
  })
  const [pwSaving, setPwSaving] = useState(false)
  const [showPw, setShowPw] = useState(false)

  // ── Notification preferences (client-side only — localStorage) ──────────
  const [notifs, setNotifs] = useState(() => {
    if (typeof window === 'undefined') {
      return { crashAlerts: true, priceSpikes: true, weeklyDigest: false }
    }
    try {
      const saved = localStorage.getItem('bitbash_notif_prefs')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { crashAlerts: true, priceSpikes: true, weeklyDigest: false }
  })

  // ── Appearance preferences ───────────────────────────────────────────────
  const [prefs, setPrefs] = useState(() => {
    if (typeof window === 'undefined') {
      return { compactMode: false, animationsEnabled: true, autoRefresh: true }
    }
    try {
      const saved = localStorage.getItem('bitbash_ui_prefs')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { compactMode: false, animationsEnabled: true, autoRefresh: true }
  })

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Update notification prefs ────────────────────────────────────────────
  function updateNotif(key: keyof typeof notifs, val: boolean) {
    const updated = { ...notifs, [key]: val }
    setNotifs(updated)
    localStorage.setItem('bitbash_notif_prefs', JSON.stringify(updated))
    showToast('ok', 'Notification preference saved.')
  }

  // ── Update UI prefs ──────────────────────────────────────────────────────
  function updatePref(key: keyof typeof prefs, val: boolean) {
    const updated = { ...prefs, [key]: val }
    setPrefs(updated)
    localStorage.setItem('bitbash_ui_prefs', JSON.stringify(updated))
    showToast('ok', 'Display preference saved.')
  }

  // ── Change password ──────────────────────────────────────────────────────
  async function handleChangePassword() {
    if (!pwForm.current) {
      showToast('err', 'Current password is required.')
      return
    }
    if (pwForm.newPw.length < 8) {
      showToast('err', 'New password must be at least 8 characters.')
      return
    }
    if (pwForm.newPw !== pwForm.confirm) {
      showToast('err', 'New passwords do not match.')
      return
    }
    if (pwForm.current === pwForm.newPw) {
      showToast('err', 'New password must be different from current.')
      return
    }

    setPwSaving(true)
    try {
      const res = await fetch('/api/settings/password', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: pwForm.current,
          newPassword: pwForm.newPw,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('err', data.error || 'Failed to change password.')
      } else {
        showToast('ok', 'Password updated. Please log in again.')
        setPwForm({ current: '', newPw: '', confirm: '' })
        // Sign out after password change for security
        setTimeout(() => signOut({ callbackUrl: '/login' }), 2000)
      }
    } catch {
      showToast('err', 'Network error. Try again.')
    } finally {
      setPwSaving(false)
    }
  }

  // ── Clear all local prefs ────────────────────────────────────────────────
  function handleClearPrefs() {
    localStorage.removeItem('bitbash_notif_prefs')
    localStorage.removeItem('bitbash_ui_prefs')
    localStorage.removeItem('tutorial_done')
    setNotifs({ crashAlerts: true, priceSpikes: true, weeklyDigest: false })
    setPrefs({ compactMode: false, animationsEnabled: true, autoRefresh: true })
    showToast('ok', 'All preferences cleared. Refreshing...')
    setTimeout(() => window.location.reload(), 1200)
  }

  const inputClass =
    'w-full px-3 py-2 rounded text-xs outline-none transition-all'
  const inputStyle = {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-primary)',
    fontFamily: 'inherit',
  }
  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border-green-dim)'
  }
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = 'var(--border-default)'
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar searchValue="" onSearchChange={() => {}} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-5 min-w-0">
          <div className="max-w-2xl">

            {/* ── Page Header ─────────────────────────────────────────────── */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="2" stroke="#22c55e" strokeWidth="1.5" />
                  <path
                    d="M8 1V3M8 13V15M1 8H3M13 8H15M2.9 2.9L4.3 4.3M11.7 11.7L13.1 13.1M2.9 13.1L4.3 11.7M11.7 4.3L13.1 2.9"
                    stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"
                  />
                </svg>
                <h1 className="text-sm font-bold tracking-widest"
                  style={{ color: 'var(--text-primary)' }}>
                  SYSTEM SETTINGS
                </h1>
              </div>
              <p className="text-[9px] tracking-widest"
                style={{ color: 'var(--text-secondary)' }}>
                SECURITY · NOTIFICATIONS · DISPLAY · SESSION
              </p>
            </div>

            {/* ── Toast ───────────────────────────────────────────────────── */}
            {toast && (
              <div
                className="rounded-lg px-4 py-2.5 mb-4 text-xs flex items-center gap-2"
                style={{
                  background: toast.type === 'ok'
                    ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                  border: `1px solid ${toast.type === 'ok'
                    ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                  color: toast.type === 'ok' ? 'var(--green-bright)' : 'var(--red-alert)',
                }}
              >
                {toast.type === 'ok' ? '✓' : '⚠'} {toast.msg}
              </div>
            )}

            {/* ── Account Info ─────────────────────────────────────────────── */}
            <Card>
              <SectionLabel>ACCOUNT OVERVIEW</SectionLabel>
              <Row label="Logged in as" sublabel={user.email}>
                <span
                  className="text-[8px] tracking-widest px-2 py-1 rounded"
                  style={{
                    background: 'var(--green-glow)',
                    border: '1px solid var(--border-green-dim)',
                    color: 'var(--green-bright)',
                  }}
                >
                  ACTIVE SESSION
                </span>
              </Row>
              <Row label="Auth method">
                <span className="text-[9px] tracking-widest"
                  style={{ color: 'var(--text-secondary)' }}>
                  {user.hasPassword ? 'Email + Password' : 'OAuth Provider'}
                </span>
              </Row>
              <div className="pt-3">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="px-4 py-2 rounded text-[9px] font-bold tracking-widest
                             transition-all"
                  style={{
                    background: 'rgba(239,68,68,0.08)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    color: 'var(--red-alert)',
                  }}
                >
                  SIGN OUT →
                </button>
              </div>
            </Card>

            {/* ── Password ─────────────────────────────────────────────────── */}
            {user.hasPassword && (
              <div className="mt-3">
                <Card>
                  <SectionLabel>CHANGE PASSWORD</SectionLabel>

                  <div className="space-y-3">
                    {/* Current password */}
                    <div>
                      <div className="text-[8px] tracking-widest mb-1.5"
                        style={{ color: 'var(--text-secondary)' }}>
                        CURRENT PASSWORD
                      </div>
                      <div className="relative">
                        <input
                          type={showPw ? 'text' : 'password'}
                          value={pwForm.current}
                          onChange={(e) =>
                            setPwForm((p) => ({ ...p, current: e.target.value }))
                          }
                          placeholder="••••••••"
                          className={inputClass}
                          style={inputStyle}
                          onFocus={inputFocus}
                          onBlur={inputBlur}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px]
                                     tracking-widest"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          {showPw ? 'HIDE' : 'SHOW'}
                        </button>
                      </div>
                    </div>

                    {/* New password */}
                    <div>
                      <div className="text-[8px] tracking-widest mb-1.5"
                        style={{ color: 'var(--text-secondary)' }}>
                        NEW PASSWORD
                      </div>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={pwForm.newPw}
                        onChange={(e) =>
                          setPwForm((p) => ({ ...p, newPw: e.target.value }))
                        }
                        placeholder="Min 8 characters"
                        className={inputClass}
                        style={inputStyle}
                        onFocus={inputFocus}
                        onBlur={inputBlur}
                      />
                      {/* Strength bar */}
                      {pwForm.newPw.length > 0 && (
                        <div className="mt-1.5 flex gap-1">
                          {[1, 2, 3, 4].map((lvl) => {
                            const strength =
                              pwForm.newPw.length < 6 ? 1
                                : pwForm.newPw.length < 10 ? 2
                                  : /[A-Z]/.test(pwForm.newPw) && /[0-9]/.test(pwForm.newPw) ? 4
                                    : 3
                            return (
                              <div
                                key={lvl}
                                className="flex-1 h-0.5 rounded-full"
                                style={{
                                  background:
                                    lvl <= strength
                                      ? strength <= 1 ? 'var(--red-alert)'
                                        : strength <= 2 ? '#f59e0b'
                                          : strength <= 3 ? '#eab308'
                                            : 'var(--green-bright)'
                                      : 'var(--border-default)',
                                }}
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Confirm password */}
                    <div>
                      <div className="text-[8px] tracking-widest mb-1.5"
                        style={{ color: 'var(--text-secondary)' }}>
                        CONFIRM NEW PASSWORD
                      </div>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={pwForm.confirm}
                        onChange={(e) =>
                          setPwForm((p) => ({ ...p, confirm: e.target.value }))
                        }
                        placeholder="Repeat new password"
                        className={inputClass}
                        style={{
                          ...inputStyle,
                          borderColor:
                            pwForm.confirm && pwForm.confirm !== pwForm.newPw
                              ? 'rgba(239,68,68,0.5)'
                              : undefined,
                        }}
                        onFocus={inputFocus}
                        onBlur={inputBlur}
                      />
                      {pwForm.confirm && pwForm.confirm !== pwForm.newPw && (
                        <div className="text-[8px] mt-1"
                          style={{ color: 'var(--red-alert)' }}>
                          Passwords do not match
                        </div>
                      )}
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={
                        pwSaving ||
                        !pwForm.current ||
                        !pwForm.newPw ||
                        pwForm.newPw !== pwForm.confirm
                      }
                      className="px-5 py-2 rounded text-[9px] font-bold tracking-widest
                                 transition-all disabled:opacity-40"
                      style={{
                        background: 'var(--green-glow)',
                        border: '1px solid var(--border-green)',
                        color: 'var(--green-bright)',
                      }}
                    >
                      {pwSaving ? 'UPDATING...' : 'UPDATE PASSWORD →'}
                    </button>
                  </div>
                </Card>
              </div>
            )}

            {/* ── Notifications ─────────────────────────────────────────────── */}
            <div className="mt-3">
              <Card>
                <SectionLabel>ALERT NOTIFICATIONS</SectionLabel>
                <Row
                  label="Crash Alerts"
                  sublabel="Notify when a coin drops sharply in 30s"
                >
                  <Toggle
                    value={notifs.crashAlerts}
                    onChange={(v) => updateNotif('crashAlerts', v)}
                  />
                </Row>
                <Row
                  label="Price Spikes"
                  sublabel="Notify on sudden upward price movement"
                >
                  <Toggle
                    value={notifs.priceSpikes}
                    onChange={(v) => updateNotif('priceSpikes', v)}
                  />
                </Row>
                <Row
                  label="Weekly Digest"
                  sublabel="Summary of market activity every Monday"
                >
                  <Toggle
                    value={notifs.weeklyDigest}
                    onChange={(v) => updateNotif('weeklyDigest', v)}
                  />
                </Row>
              </Card>
            </div>

            {/* ── Display Preferences ──────────────────────────────────────── */}
            <div className="mt-3">
              <Card>
                <SectionLabel>DISPLAY PREFERENCES</SectionLabel>
                <Row
                  label="Compact Mode"
                  sublabel="Reduce spacing across all views"
                >
                  <Toggle
                    value={prefs.compactMode}
                    onChange={(v) => updatePref('compactMode', v)}
                  />
                </Row>
                <Row
                  label="Animations"
                  sublabel="Enable motion and transitions"
                >
                  <Toggle
                    value={prefs.animationsEnabled}
                    onChange={(v) => updatePref('animationsEnabled', v)}
                  />
                </Row>
                <Row
                  label="Auto-Refresh Prices"
                  sublabel="Refresh market data every 5 seconds"
                >
                  <Toggle
                    value={prefs.autoRefresh}
                    onChange={(v) => updatePref('autoRefresh', v)}
                  />
                </Row>
              </Card>
            </div>

            {/* ── Data & Privacy ────────────────────────────────────────────── */}
            <div className="mt-3 mb-8">
              <Card>
                <SectionLabel>DATA & PRIVACY</SectionLabel>
                <Row
                  label="Clear All Preferences"
                  sublabel="Resets notifications, display settings, and tutorial"
                >
                  <button
                    onClick={handleClearPrefs}
                    className="px-3 py-1.5 rounded text-[9px] font-bold tracking-widest
                               transition-all"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-green-dim)'
                      e.currentTarget.style.color = 'var(--green-bright)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                  >
                    CLEAR →
                  </button>
                </Row>
                <Row
                  label="Replay Tutorial"
                  sublabel="Show the onboarding guide again on next visit"
                >
                  <button
                    onClick={() => {
                      localStorage.removeItem('tutorial_done')
                      showToast('ok', 'Tutorial will show on next page load.')
                    }}
                    className="px-3 py-1.5 rounded text-[9px] font-bold tracking-widest
                               transition-all"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-default)',
                      color: 'var(--text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-green-dim)'
                      e.currentTarget.style.color = 'var(--green-bright)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'var(--border-default)'
                      e.currentTarget.style.color = 'var(--text-secondary)'
                    }}
                  >
                    RESET →
                  </button>
                </Row>
              </Card>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
