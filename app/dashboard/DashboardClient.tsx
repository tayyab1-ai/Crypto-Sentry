// app/dashboard/DashboardClient.tsx
'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import CoinTable from '@/components/CoinTable'
import TutorialGuide from '@/components/TutorialGuide'
import Sparkline from '@/components/Sparkline'

interface Props {
  userName: string
  initialWatchlist: string[]
}

interface MarketOverview {
  btcPrice: number
  ethPrice: number
  btcChange: number
  ethChange: number
  marketCap: string
  volume: string
  marketChange: number
  btcStatus: string
  ethStatus: string
  volatilityIndex: number
  buyPressure: number
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  btcHistory: number[]
  ethHistory: number[]
}

// Mini bar chart for 24h market change
function MiniBarChart({ change }: { change: number }) {
  const bars = 8
  const color = change >= 0 ? '#22c55e' : '#ef4444'
  return (
    <div className="flex items-end gap-0.5 h-10">
      {[...Array(bars)].map((_, i) => {
        const h = 20 + Math.random() * 60
        return (
          <div
            key={i}
            className="w-2.5 rounded-sm shrink-0"
            style={{
              height: `${h}%`,
              background: i === bars - 1 ? color : `${color}40`
            }}
          />
        )
      })}
    </div>
  )
}



export default function DashboardClient({ userName, initialWatchlist }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'watchlist' | 'gainers' | 'losers'>('all')
  const [watchlist, setWatchlist] = useState<string[]>(initialWatchlist)
  const [overview, setOverview] = useState<MarketOverview | null>(null)
  const [recentAlert, setRecentAlert] = useState<any>(null)

  // Fetch market overview data from prices API
  const fetchOverview = async () => {
    try {
      const res = await fetch('/api/prices')
      const data = await res.json()
      if (data.prices) {
        const btc = data.prices['bitcoin']
        const eth = data.prices['ethereum']
        if (btc && eth) {
          setOverview({
            btcPrice: btc.usd,
            ethPrice: eth.usd,
            btcChange: btc.usd_24h_change || 0,
            ethChange: eth.usd_24h_change || 0,
            marketCap: '$3.1T',
            volume: '$110.9B',
            marketChange: -0.48,
            btcStatus: btc.status === 'alert' ? 'ALERT' : 'STABLE',
            ethStatus: eth.status === 'alert' ? 'ALERT' : 'STABLE',
            volatilityIndex: 14.2,
            buyPressure: 68,
            sentiment: 'BULLISH',
            btcHistory: data.history?.['bitcoin'] || [],
            ethHistory: data.history?.['ethereum'] || [],
          })
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const fetchRecentAlert = async () => {
    try {
      const res = await fetch('/api/alert?limit=1')
      const data = await res.json()
      if (data && data.length > 0) {
        setRecentAlert(data[0])
      }
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    fetchOverview()
    fetchRecentAlert()
    const interval = setInterval(() => {
      fetchOverview()
      fetchRecentAlert()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const timeAgo = (dateStr: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}hr ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  const handleToggleWatchlist = async (assetId: string, assetName: string) => {
    const isInWatchlist = watchlist.includes(assetId)
    if (isInWatchlist) {
      setWatchlist(prev => prev.filter(id => id !== assetId))
    } else {
      setWatchlist(prev => [...prev, assetId])
    }
    try {
      if (isInWatchlist) {
        await fetch(`/api/watchlist/${assetId}`, { method: 'DELETE' })
      } else {
        await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ asset_id: assetId, asset_name: assetName }),
        })
      }
    } catch (err) {
      if (isInWatchlist) {
        setWatchlist(prev => [...prev, assetId])
      } else {
        setWatchlist(prev => prev.filter(id => id !== assetId))
      }
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <TutorialGuide userName={userName} />
      <Navbar searchValue={searchQuery} onSearchChange={setSearchQuery} />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-5 min-w-0">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-5" id="dashboard-stats">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 12L6 7L9 10L14 4" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <h1 className="text-sm font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>
                  TERMINAL ONE
                </h1>
              </div>
              <p className="text-[9px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                REAL-TIME INTELLIGENCE AGGREGATE V4.2.0
              </p>
            </div>
          </div>

          {/* Market Overview Grid */}
          {overview && (
            <div className="grid grid-cols-4 gap-3 mb-5">

              {/* Market Overview Card */}
              <div
                className="rounded-lg p-4 col-span-1"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: 'var(--green-bright)' }} />
                  <span className="text-[9px] tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
                    MARKET OVERVIEW
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.4)' }} />
                      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>GLOBAL MARKET CAP</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{overview.marketCap}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.4)' }} />
                      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>24H VOLUME</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>{overview.volume}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3.5 h-3.5 rounded-full" style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)' }} />
                      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>MARKET CHANGE</span>
                    </div>
                    <span className="text-[10px] font-bold" style={{ color: overview.marketChange >= 0 ? 'var(--green-bright)' : 'var(--red-alert)' }}>
                      {overview.marketChange >= 0 ? '+' : ''}{overview.marketChange.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* BTC Card */}
              <div
                className="rounded-lg p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <div className="text-[8px] tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>BITCOIN</div>
                <div className="text-sm font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>BTC/USD</div>
                <div className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  ${overview.btcPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between">
                  <Sparkline values={overview.btcHistory} positive={overview.btcChange >= 0} />
                  <span
                    className="text-[8px] tracking-widest px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      color: 'var(--green-bright)'
                    }}
                  >
                    {overview.btcStatus}
                  </span>
                </div>
                <div className="text-[8px] tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>REAL-TIME DATA FEED</div>
              </div>

              {/* ETH Card */}
              <div
                className="rounded-lg p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <div className="text-[8px] tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>ETHEREUM</div>
                <div className="text-sm font-bold tracking-tight mb-1" style={{ color: 'var(--text-primary)' }}>ETH/USD</div>
                <div className="text-xl font-black mb-2" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                  ${overview.ethPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between">
                  <Sparkline values={overview.ethHistory} positive={overview.ethChange >= 0} />
                  <span
                    className="text-[8px] tracking-widest px-2 py-0.5 rounded"
                    style={{
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.3)',
                      color: 'var(--green-bright)'
                    }}
                  >
                    {overview.ethStatus}
                  </span>
                </div>
                <div className="text-[8px] tracking-widest mt-1" style={{ color: 'var(--text-muted)' }}>REAL-TIME DATA FEED</div>
              </div>

              {/* Recent Alert */}
              <div
                className="rounded-lg p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="status-dot online" />
                  <span className="text-[9px] tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
                    RECENT ALERT
                  </span>
                  <span className="text-[8px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>LIVE FEED</span>
                </div>
                {recentAlert ? (
                  <div
                    className="rounded-lg px-4 py-3 flex justify-between"
                    style={{
                      background: recentAlert.alert_type === 'CRASH' ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {recentAlert.asset_id.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">
                        {recentAlert.alert_type}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white">
                        ${recentAlert.price_at_drop}
                      </div>
                      <div
                        className="text-[10px] mt-0.5 font-bold"
                        style={{
                          color: recentAlert.drop_percentage > 0 ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {recentAlert.drop_percentage > 0 ? '+' : ''}{recentAlert.drop_percentage}%
                      </div>
                      <div className="text-[9px] text-gray-500 mt-1">
                        {timeAgo(recentAlert.detected_at)}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-[9px] tracking-widest text-center py-4" style={{ color: 'var(--text-muted)' }}>
                    No alerts triggered
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sentry Analytics + 24h Chart */}
          {overview && (
            <div className="grid grid-cols-3 gap-3 mb-5">
              {/* Sentry Analytics */}
              <div
                className="col-span-2 rounded-lg p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 10L4 6L7 8L10 3L13 5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-[9px] tracking-widest font-bold" style={{ color: 'var(--text-primary)' }}>
                      SENTRY ANALYTICS
                    </span>
                  </div>
                  <div
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ background: 'var(--green-glow)', border: '1px solid var(--border-green-dim)' }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M5 1V5L7 7" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </div>
                </div>
                <p className="text-[9px] mb-3" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                  AI-driven sentiment analysis suggests a{' '}
                  <span style={{ color: 'var(--green-bright)', fontWeight: 'bold' }}>{overview.sentiment}</span>
                  {' '}trend. No liquidity drains detected in current cycle.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    className="rounded p-2.5"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
                  >
                    <div className="text-[8px] tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>VOLATILITY INDEX</div>
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      {overview.volatilityIndex}%{' '}
                      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>LOW</span>
                    </div>
                  </div>
                  <div
                    className="rounded p-2.5"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-default)' }}
                  >
                    <div className="text-[8px] tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>BUY PRESSURE</div>
                    <div className="text-sm font-bold" style={{ color: 'var(--green-bright)' }}>
                      {overview.buyPressure}%{' '}
                      <span className="text-[9px]" style={{ color: 'var(--text-secondary)' }}>HIGH</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 24h Market Change */}
              <div
                className="rounded-lg p-4"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
              >
                <div className="text-[8px] tracking-widest mb-2" style={{ color: 'var(--text-secondary)' }}>
                  24H MARKET CHANGE
                </div>
                <div
                  className="text-2xl font-black mb-3"
                  style={{
                    color: overview.marketChange >= 0 ? 'var(--green-bright)' : 'var(--red-alert)',
                    fontVariantNumeric: 'tabular-nums'
                  }}
                >
                  {overview.marketChange >= 0 ? '+' : ''}{overview.marketChange.toFixed(2)}%
                </div>
                <MiniBarChart change={overview.marketChange} />
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-4" id="filter-tabs">
            {[
              { key: 'all', label: 'ALL COINS' },
              { key: 'watchlist', label: 'MY WATCHLIST' },
              { key: 'gainers', label: 'TOP GAINERS' },
              { key: 'losers', label: 'TOP LOSERS' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className="px-3 py-1.5 rounded text-[9px] font-bold tracking-widest transition-all"
                style={{
                  background: filter === key ? 'var(--green-glow)' : 'var(--bg-card)',
                  border: `1px solid ${filter === key ? 'var(--border-green)' : 'var(--border-default)'}`,
                  color: filter === key ? 'var(--green-bright)' : 'var(--text-secondary)'
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Coin Blocks */}
          <CoinTable
            searchQuery={searchQuery}
            filter={filter}
            watchlist={watchlist}
            onToggleWatchlist={handleToggleWatchlist}
          />
        </main>
      </div>
    </div>
  )
}
