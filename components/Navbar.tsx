// components/Navbar.tsx
'use client'
import { useSession } from 'next-auth/react'

interface NavbarProps {
  searchValue: string
  onSearchChange: (val: string) => void
}

export default function Navbar({ searchValue, onSearchChange }: NavbarProps) {
  const { data: session } = useSession()

  return (
    <nav 
      className="px-6 py-3 flex items-center justify-between sticky top-0 z-40"
      style={{ 
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-default)',
      }}
    >
      {/* Search Bar */}
      <div id="search-bar" className="flex-1 max-w-sm">
        <div className="relative">
          <svg 
            className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
            style={{ color: 'var(--text-secondary)' }}
            viewBox="0 0 16 16" fill="none"
          >
            <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 11L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search Index..."
            className="w-full text-xs py-2 pl-9 pr-4 rounded outline-none transition-all"
            style={{ 
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              fontFamily: 'inherit',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'var(--border-green-dim)'
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'var(--border-default)'
            }}
          />
        </div>
      </div>

      {/* Right side — live indicator */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="status-dot online"></span>
          <span className="text-[10px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>
            LIVE FEED
          </span>
        </div>
        <div 
          className="text-[10px] tracking-widest px-2 py-1 rounded"
          style={{ 
            color: 'var(--text-secondary)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-default)'
          }}
        >
          {session?.user?.name?.toUpperCase() || 'OPERATIVE'}
        </div>
      </div>
    </nav>
  )
}
