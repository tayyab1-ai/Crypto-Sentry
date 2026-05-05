'use client'
import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import CoinTable from '@/components/CoinTable'
import Link from 'next/link'

export default function WatchlistClient({ watchlistItems, userName }: any) {
  const [searchQuery, setSearchQuery] = useState('')
  const [watchlist, setWatchlist] = useState<string[]>(
    watchlistItems.map((w: any) => w.asset_id)
  )

  const handleToggle = async (assetId: string, assetName: string) => {
    const isIn = watchlist.includes(assetId)
    setWatchlist(prev => isIn ? prev.filter(id => id !== assetId) : [...prev, assetId])
    if (isIn) {
      await fetch(`/api/watchlist/${assetId}`, { method: 'DELETE' })
    } else {
      await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ asset_id: assetId, asset_name: assetName }),
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar searchValue={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-5 min-w-0">
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L9.8 5.6L15 6.2L11.2 9.6L12.4 15L8 12.4L3.6 15L4.8 9.6L1 6.2L6.2 5.6L8 1Z" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              <h1 className="text-sm font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>
                MY WATCHLIST
              </h1>
            </div>
            <p className="text-[9px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              PRIORITY OPERATIONAL TARGETS
            </p>
          </div>

          {watchlist.length === 0 ? (
            <div className="text-center py-20">
              <div 
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L9.8 5.6L15 6.2L11.2 9.6L12.4 15L8 12.4L3.6 15L4.8 9.6L1 6.2L6.2 5.6L8 1Z" stroke="#3a4a3a" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-xs tracking-widest mb-4" style={{ color: 'var(--text-secondary)' }}>
                NO ASSETS IN WATCHLIST
              </p>
              <Link
                href="/market"
                className="inline-block px-5 py-2 rounded text-xs font-bold tracking-widest transition-all"
                style={{ 
                  background: 'var(--green-glow)',
                  border: '1px solid var(--border-green)',
                  color: 'var(--green-bright)'
                }}
              >
                GO TO MARKET →
              </Link>
            </div>
          ) : (
            <CoinTable
              searchQuery={searchQuery}
              filter="watchlist"
              watchlist={watchlist}
              onToggleWatchlist={handleToggle}
            />
          )}
        </main>
      </div>
    </div>
  )
}
