'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

interface Props {
  user: {
    name: string
    email: string
    image: string | null
    hasPassword: boolean
    createdAt: string | null
  }
  watchlistCount: number
}

function timeAgo(dateStr: string): string {
  const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (secs < 60) return `${secs}s ago`
  if (secs < 3600) return `${Math.floor(secs / 60)}min ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}hr ago`
  return `${Math.floor(secs / 86400)} days ago`
}

function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown'
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

// ─── Reusable section card ───────────────────────────────────────────────────
function Card({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div
      className="rounded-lg p-5"
      style={{
        background: danger ? 'rgba(239,68,68,0.03)' : 'var(--bg-card)',
        border: `1px solid ${danger ? 'rgba(239,68,68,0.15)' : 'var(--border-default)'}`,
      }}
    >
      {children}
    </div>
  )
}

function SectionLabel({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div
      className="text-[9px] tracking-widest font-bold mb-4"
      style={{ color: danger ? 'var(--red-alert)' : 'var(--text-secondary)' }}
    >
      {children}
    </div>
  )
}

export default function ProfileClient({
  user: initialUser,
  watchlistCount,
}: Props) {
  const router = useRouter()
  const { update } = useSession()
  const [user, setUser] = useState(initialUser)

  // Edit name state
  const [editing, setEditing] = useState(false)
  const [newName, setNewName] = useState(user.name)
  const [saving, setSaving] = useState(false)

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  // Toast message
  const [toast, setToast] = useState<{ type: 'ok' | 'err'; msg: string } | null>(null)

  // Delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const initial = user.name.charAt(0).toUpperCase()

  function showToast(type: 'ok' | 'err', msg: string) {
    setToast({ type, msg })
    setTimeout(() => setToast(null), 4000)
  }

  // ── Update name ──────────────────────────────────────────────────────────
  async function handleSaveName() {
    const trimmed = newName.trim()
    if (trimmed.length < 3) {
      showToast('err', 'Name must be at least 3 characters.')
      return
    }
    if (trimmed === user.name) {
      setEditing(false)
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('err', data.error || 'Failed to update name.')
      } else {
        showToast('ok', 'Operative name updated.')
        setUser(prev => ({ ...prev, name: trimmed }))
        setEditing(false)
        await update({ name: trimmed })
        router.refresh()
      }
    } catch {
      showToast('err', 'Network error. Try again.')
    } finally {
      setSaving(false)
    }
  }

  // ── Handle Image Upload ──────────────────────────────────────────────────
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      // 1. Get Signature from backend
      const resSig = await fetch('/api/upload-signature', { method: 'POST' })
      const sigData = await resSig.json()
      if (!resSig.ok) throw new Error(sigData.error || 'Failed to get upload signature')

      // 2. Upload to Cloudinary (Signed)
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sigData.apiKey)
      formData.append('timestamp', sigData.timestamp.toString())
      formData.append('signature', sigData.signature)
      formData.append('folder', 'profile_images')
      
      const resCloud = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      })
      
      const dataCloud = await resCloud.json()
      if (!resCloud.ok) throw new Error(dataCloud.error?.message || 'Cloudinary upload failed')

      const imageUrl = dataCloud.secure_url

      // 3. Update DB
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imageUrl }),
      })

      if (res.ok) {
        setUser(prev => ({ ...prev, image: imageUrl }))
        showToast('ok', 'Profile image updated.')
        await update({ image: imageUrl })
        router.refresh()
      } else {
        showToast('err', 'Failed to save image to profile.')
      }
    } catch (err: any) {
      showToast('err', err.message || 'Failed to upload image.')
    } finally {
      setUploading(false)
    }
  }

  // ── Handle Remove Image ──────────────────────────────────────────────────
  async function handleRemoveImage() {
    setUploading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: null }),
      })

      if (res.ok) {
        setUser(prev => ({ ...prev, image: null }))
        showToast('ok', 'Profile image removed.')
        await update({ image: null })
        router.refresh()
      } else {
        showToast('err', 'Failed to remove image.')
      }
    } catch {
      showToast('err', 'Network error.')
    } finally {
      setUploading(false)
    }
  }

  // ── Delete account ───────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    setDeleting(true)
    try {
      const res = await fetch('/api/profile', { method: 'DELETE' })
      if (res.ok) {
        await signOut({ callbackUrl: '/login' })
      } else {
        const data = await res.json()
        showToast('err', data.error || 'Failed to delete account.')
        setConfirmDelete(false)
      }
    } catch {
      showToast('err', 'Network error. Try again.')
      setConfirmDelete(false)
    } finally {
      setDeleting(false)
    }
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
                  <circle cx="8" cy="5" r="3" stroke="#22c55e" strokeWidth="1.5" />
                  <path d="M2 14C2 11.2 4.7 9 8 9C11.3 9 14 11.2 14 14"
                    stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <h1 className="text-sm font-bold tracking-widest"
                  style={{ color: 'var(--text-primary)' }}>
                  OPERATIVE PROFILE
                </h1>
              </div>
              <p className="text-[9px] tracking-widest"
                style={{ color: 'var(--text-secondary)' }}>
                IDENTITY · STATS · ACCESS LOG
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

            {/* ── Identity Card ────────────────────────────────────────────── */}
            <Card>
              <SectionLabel>IDENTITY CARD</SectionLabel>

              <div className="flex items-start gap-5">
                {/* Avatar */}
                <div className="relative group shrink-0">
                  {user.image ? (
                    <img src={user.image} alt="avatar"
                      className="w-16 h-16 rounded-lg object-cover"
                      style={{ border: '1px solid var(--border-green-dim)' }} />
                  ) : (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center
                                  text-2xl font-black"
                      style={{
                        background: 'var(--green-glow)',
                        border: '1px solid var(--border-green-dim)',
                        color: 'var(--green-bright)',
                      }}
                    >
                      {initial}
                    </div>
                  )}

                  {/* Upload Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center 
                                bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity 
                                rounded-lg cursor-pointer gap-1"
                       onClick={() => fileInputRef.current?.click()}>
                    <span className="text-[8px] font-bold tracking-widest text-white">
                      {uploading ? '...' : 'EDIT'}
                    </span>
                  </div>

                  <input 
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  
                  {user.image && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full 
                                 flex items-center justify-center text-[10px] text-white
                                 hover:bg-red-600 transition-colors shadow-lg"
                      title="Remove Image"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Fields */}
                <div className="flex-1 space-y-4">

                  {/* Name */}
                  <div>
                    <div className="text-[8px] tracking-widest mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}>
                      OPERATIVE NAME
                    </div>
                    {editing ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveName()
                            if (e.key === 'Escape') {
                              setNewName(user.name)
                              setEditing(false)
                            }
                          }}
                          autoFocus
                          maxLength={50}
                          className="flex-1 px-3 py-1.5 rounded text-xs outline-none"
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-green-dim)',
                            color: 'var(--text-primary)',
                            fontFamily: 'inherit',
                          }}
                        />
                        <button
                          onClick={handleSaveName}
                          disabled={saving}
                          className="px-3 py-1.5 rounded text-[9px] font-bold tracking-widest
                                     disabled:opacity-50 transition-all"
                          style={{
                            background: 'var(--green-glow)',
                            border: '1px solid var(--border-green)',
                            color: 'var(--green-bright)',
                          }}
                        >
                          {saving ? '...' : 'SAVE'}
                        </button>
                        <button
                          onClick={() => { setNewName(user.name); setEditing(false) }}
                          className="px-3 py-1.5 rounded text-[9px] tracking-widest transition-all"
                          style={{
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border-default)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          CANCEL
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold"
                          style={{ color: 'var(--text-primary)' }}>
                          {user.name}
                        </span>
                        <button
                          onClick={() => { setEditing(true) }}
                          className="text-[8px] tracking-widest px-2 py-0.5 rounded
                                     transition-all"
                          style={{
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border-default)',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.color = 'var(--green-bright)'
                            e.currentTarget.style.borderColor = 'var(--border-green-dim)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.color = 'var(--text-secondary)'
                            e.currentTarget.style.borderColor = 'var(--border-default)'
                          }}
                        >
                          EDIT ✎
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <div className="text-[8px] tracking-widest mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}>
                      EMAIL IDENTIFIER
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      {user.email}
                    </div>
                  </div>

                  {/* Enrolled since */}
                  <div>
                    <div className="text-[8px] tracking-widest mb-1.5"
                      style={{ color: 'var(--text-secondary)' }}>
                      ENROLLED SINCE
                    </div>
                    <div className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      {formatDate(user.createdAt)}
                    </div>
                  </div>

                  {/* Auth method badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[8px] tracking-widest px-2 py-1 rounded"
                      style={{
                        background: 'var(--green-glow)',
                        border: '1px solid var(--border-green-dim)',
                        color: 'var(--green-bright)',
                      }}
                    >
                      {user.hasPassword ? '🔑 CREDENTIALS AUTH' : '🔒 OAUTH PROVIDER'}
                    </span>
                  </div>

                </div>
              </div>
            </Card>

            {/* ── Stats ───────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 gap-3 mt-3">
              {[
                { value: watchlistCount, label: 'ASSETS TRACKED', color: 'var(--green-bright)' },
                { value: 'V4', label: 'SENTRY BUILD', color: '#f59e0b' },
              ].map(({ value, label, color }) => (
                <div
                  key={label}
                  className="rounded-lg p-4 text-center"
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <div className="text-2xl font-black mb-1" style={{ color }}>
                    {value}
                  </div>
                  <div className="text-[8px] tracking-widest"
                    style={{ color: 'var(--text-secondary)' }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>


            {/* ── Danger Zone ─────────────────────────────────────────────── */}
            <div className="mt-3">
              <Card danger>
                <SectionLabel danger>DANGER ZONE</SectionLabel>

                {!confirmDelete ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold mb-0.5"
                        style={{ color: 'var(--text-primary)' }}>
                        Delete Account
                      </div>
                      <div className="text-[9px]"
                        style={{ color: 'var(--text-secondary)' }}>
                        Permanently removes your account and all data. Cannot be undone.
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="ml-4 px-4 py-2 rounded text-[9px] font-bold
                                 tracking-widest shrink-0 transition-all"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        border: '1px solid rgba(239,68,68,0.3)',
                        color: 'var(--red-alert)',
                      }}
                    >
                      DELETE ACCOUNT
                    </button>
                  </div>
                ) : (
                  <div
                    className="rounded-lg p-4"
                    style={{
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.3)',
                    }}
                  >
                    <div className="text-xs font-bold mb-1"
                      style={{ color: 'var(--red-alert)' }}>
                      ⚠ Confirm Deletion
                    </div>
                    <div className="text-[9px] mb-4"
                      style={{ color: 'var(--text-secondary)' }}>
                      All your watchlists and account data will be permanently deleted.
                      This action cannot be reversed.
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting}
                        className="px-4 py-2 rounded text-[9px] font-bold
                                   tracking-widest disabled:opacity-50 transition-all"
                        style={{ background: 'var(--red-alert)', color: '#fff' }}
                      >
                        {deleting ? 'DELETING...' : 'YES, DELETE'}
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-4 py-2 rounded text-[9px] font-bold
                                   tracking-widest transition-all"
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-default)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        CANCEL
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}
