// components/Sidebar.tsx
'use client'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'

const links = [
  { href: '/dashboard', icon: DashboardIcon, label: 'Dashboard', id: 'nav-dashboard' },
  { href: '/watchlist', icon: WatchlistIcon, label: 'Watchlist', id: 'nav-watchlist' },
  { href: '/alerts', icon: AlertsIcon, label: 'Alerts', id: 'nav-alerts' },
  { href: '/market', icon: MarketIcon, label: 'Market Data', id: 'nav-market' },
  { href: '/profile', icon: ProfileIcon, label: 'Profile', id: 'nav-profile' },
  { href: '/settings', icon: SettingsIcon, label: 'Settings', id: 'nav-settings' },
]

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  )
}

function WatchlistIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L9.8 5.6L15 6.2L11.2 9.6L12.4 15L8 12.4L3.6 15L4.8 9.6L1 6.2L6.2 5.6L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
    </svg>
  )
}

function AlertsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 1L14 13H2L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="8" cy="11" r="0.75" fill="currentColor"/>
    </svg>
  )
}

function MarketIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M5 7H9M7 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M2 14C2 11.2 4.7 9 8 9C11.3 9 14 11.2 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 1V3M8 13V15M1 8H3M13 8H15M2.9 2.9L4.3 4.3M11.7 11.7L13.1 13.1M2.9 13.1L4.3 11.7M11.7 4.3L13.1 2.9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export default function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userName = session?.user?.name || 'OPERATIVE'
  const userInitial = userName.charAt(0).toUpperCase()

  return (
    <aside 
      className="w-48 shrink-0 min-h-screen flex flex-col"
      style={{ 
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-default)'
      }}
    >
      {/* Brand Logo */}
      <div 
        className="px-4 py-5 flex items-center gap-2"
        style={{ borderBottom: '1px solid var(--border-default)' }}
      >
        <div 
          className="w-7 h-7 rounded flex items-center justify-center"
          style={{ 
            background: 'var(--green-glow)',
            border: '1px solid var(--border-green)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="3" stroke="#22c55e" strokeWidth="1.5"/>
            <path d="M7 1V3M7 11V13M1 7H3M11 7H13" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <div className="text-xs font-bold tracking-widest" style={{ color: 'var(--green-bright)' }}>BITBASH</div>
          <div className="text-[8px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>SENTRY V4</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-0.5">
        {links.map((link) => {
          const Icon = link.icon
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              id={link.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium tracking-wide transition-all duration-150"
              style={{
                color: isActive ? 'var(--green-bright)' : 'var(--text-secondary)',
                background: isActive ? 'var(--green-glow)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--green-bright)' : '2px solid transparent',
              }}
            >
              <span style={{ opacity: isActive ? 1 : 0.6 }}>
                <Icon />
              </span>
              <span>{link.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* User Info at Bottom */}
      <div 
        className="px-3 py-4"
        style={{ borderTop: '1px solid var(--border-default)' }}
      >
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-2 py-2 rounded transition-all"
          style={{ 
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)'
          }}
        >
          <div 
            className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold shrink-0"
            style={{ 
              background: 'var(--green-glow)',
              border: '1px solid var(--border-green-dim)',
              color: 'var(--green-bright)'
            }}
          >
            {userInitial}
          </div>
          <div className="flex-1 text-left overflow-hidden">
            <div className="text-[10px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
              {userName.toUpperCase()}
            </div>
            <div className="text-[8px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              LOGOUT →
            </div>
          </div>
        </button>
      </div>
    </aside>
  )
}
