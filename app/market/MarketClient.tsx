'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'
import { motion, AnimatePresence } from 'framer-motion'

interface CoinData {
  usd: number
  usd_24h_change: number
  usd_market_cap: number
  name: string
  status: 'stable' | 'alert'
}

const COIN_SYMBOLS: Record<string, string> = {
  bitcoin: 'BTC', ethereum: 'ETH', binancecoin: 'BNB',
  solana: 'SOL', cardano: 'ADA', xrp: 'XRP',
  dogecoin: 'DOGE', polygon: 'MATIC', 'avalanche-2': 'AVAX',
  chainlink: 'LINK', litecoin: 'LTC', stellar: 'XLM',
  uniswap: 'UNI', cosmos: 'ATOM', algorand: 'ALGO', tron: 'TRX',
  filecoin: 'FIL', vechain: 'VET', 'theta-token': 'THETA', monero: 'XMR',
}

const COIN_COLORS: Record<string, string> = {
  bitcoin: '#F7931A', ethereum: '#627EEA', binancecoin: '#F3BA2F',
  solana: '#9945FF', cardano: '#0033AD', xrp: '#346AA9',
  dogecoin: '#C2A633', polygon: '#8247E5', 'avalanche-2': '#E84142',
  chainlink: '#375BD2', litecoin: '#BFBBBB', stellar: '#7D00FF',
  uniswap: '#FF007A', cosmos: '#2E3148', algorand: '#000000', tron: '#FF0013',
  filecoin: '#0090FF', vechain: '#15BDFF', 'theta-token': '#2AB8E6', monero: '#FF6600',
}

const formatMarketCap = (val?: number) => {
  if (!val) return '—'
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`
  if (val >= 1e6) return `$${(val / 1e6).toFixed(2)}M`
  return `$${val.toLocaleString()}`
}

export default function MarketClient({ userName, initialWatchlist }: any) {
  const [searchQuery, setSearchQuery] = useState('')
  const [watchlist, setWatchlist] = useState<string[]>(initialWatchlist)
  const [prices, setPrices] = useState<Record<string, CoinData>>({})
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [stale, setStale] = useState(false)

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/prices')
      const data = await res.json()
      if (data.prices) {
        setPrices(data.prices)
        setStale(data.stale || false)
        setLastUpdate(new Date())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleToggleWatchlist = async (assetId: string, assetName: string) => {
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

  const timeAgo = (date: Date): string => {
    const secs = Math.floor((Date.now() - date.getTime()) / 1000)
    if (secs < 5) return 'just now'
    if (secs < 60) return `${secs}s ago`
    return `${Math.floor(secs / 60)}min ago`
  }

  const filteredCoins = Object.entries(prices).filter(([id, data]) => {
    const name = data.name?.toLowerCase() || id
    const symbol = (COIN_SYMBOLS[id] || '').toLowerCase()
    const q = searchQuery.toLowerCase()
    return name.includes(q) || symbol.includes(q) || id.includes(q)
  })

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar searchValue={searchQuery} onSearchChange={setSearchQuery} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-5 min-w-0">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="7" cy="7" r="5" stroke="#22c55e" strokeWidth="1.5"/>
                  <path d="M11 11L14 14" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M5 7H9M7 5V9" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <h1 className="text-sm font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>
                  MARKET EXPLORER
                </h1>
              </div>
              <p className="text-[9px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                ASSET INDEX & LIQUIDITY MAP
              </p>
            </div>
            {lastUpdate && (
              <div className="flex items-center gap-1.5">
                <span className="status-dot online"/>
                <span className="text-[9px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  {timeAgo(lastUpdate).toUpperCase()}
                </span>
              </div>
            )}
          </div>

          {stale && (
            <div 
              className="rounded-lg px-4 py-2.5 mb-4 text-xs flex items-center gap-2"
              style={{ 
                background: 'rgba(234,179,8,0.08)',
                border: '1px solid rgba(234,179,8,0.3)',
                color: '#eab308'
              }}
            >
              ⚠ Data may be stale — Check your connection.
            </div>
          )}

          {/* Market Table */}
          <div 
            className="rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border-default)' }}
          >
            {/* Table Header */}
            <div 
              className="grid px-5 py-3 text-[9px] tracking-widest font-bold"
              style={{ 
                background: 'var(--bg-secondary)',
                borderBottom: '1px solid var(--border-default)',
                color: 'var(--text-secondary)',
                gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr'
              }}
            >
              <span>ASSET</span>
              <span>LAST QUOTE</span>
              <span>24H DELTA</span>
              <span>MARKET CAP</span>
              <span className="text-center">ACTIONS</span>
            </div>

            {loading ? (
              <div>
                {[...Array(8)].map((_, i) => (
                  <div 
                    key={i} 
                    className="px-5 py-4 animate-pulse flex items-center gap-4"
                    style={{ 
                      borderBottom: '1px solid var(--border-default)',
                      background: i % 2 === 0 ? 'var(--bg-card)' : 'transparent'
                    }}
                  >
                    <div className="w-6 h-6 rounded-full" style={{ background: 'var(--border-default)' }}/>
                    <div className="h-3 w-24 rounded" style={{ background: 'var(--border-default)' }}/>
                  </div>
                ))}
              </div>
            ) : (
              <AnimatePresence>
                {filteredCoins.map(([id, data], index) => {
                  const isWatched = watchlist.includes(id)
                  const change24h = data.usd_24h_change || 0
                  const isPositive = change24h >= 0
                  const isAlert = data.status === 'alert'
                  const symbol = COIN_SYMBOLS[id] || id.toUpperCase().slice(0, 4)
                  const color = COIN_COLORS[id] || '#22c55e'
                  const marketCap = formatMarketCap(data.usd_market_cap)

                  return (
                    <motion.div
                      key={id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="grid px-5 py-3 items-center transition-all"
                      style={{ 
                        gridTemplateColumns: '2fr 1.5fr 1fr 1.5fr 1fr',
                        borderBottom: '1px solid var(--border-default)',
                        background: isAlert ? 'rgba(239,68,68,0.03)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = isAlert 
                          ? 'rgba(239,68,68,0.06)' 
                          : 'var(--bg-card-hover)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isAlert 
                          ? 'rgba(239,68,68,0.03)' 
                          : 'transparent'
                      }}
                    >
                      {/* Asset */}
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
                          style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                        >
                          <img 
                            src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`}
                            alt={symbol}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><text x="50%" y="50%" font-size="12" font-family="sans-serif" font-weight="900" fill="${encodeURIComponent(color)}" dominant-baseline="central" text-anchor="middle">${symbol.slice(0, 1)}</text></svg>`;
                            }}
                          />
                        </div>
                        <div>
                          <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                            {data.name || id}
                          </div>
                          <div className="text-[8px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                            {symbol}
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div 
                        className="text-xs font-bold"
                        style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}
                      >
                        ${data.usd?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                      </div>

                      {/* 24h Delta */}
                      <div 
                        className="text-xs font-bold"
                        style={{ color: isPositive ? 'var(--green-bright)' : 'var(--red-alert)' }}
                      >
                        {isPositive ? '▲+' : '▼'}{Math.abs(change24h).toFixed(2)}%
                      </div>

                      {/* Market Cap */}
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {marketCap}
                      </div>

                      {/* Watchlist Action */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => handleToggleWatchlist(id, data.name || id)}
                          className="w-7 h-7 rounded flex items-center justify-center transition-all hover:scale-110"
                          style={{ 
                            background: isWatched ? 'rgba(245,158,11,0.1)' : 'var(--bg-card)',
                            border: `1px solid ${isWatched ? 'rgba(245,158,11,0.4)' : 'var(--border-default)'}`,
                            color: isWatched ? '#f59e0b' : 'var(--text-muted)'
                          }}
                        >
                          {isWatched ? (
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M8 1L9.8 5.6L15 6.2L11.2 9.6L12.4 15L8 12.4L3.6 15L4.8 9.6L1 6.2L6.2 5.6L8 1Z"/>
                            </svg>
                          ) : (
                            <svg width="11" height="11" viewBox="0 0 16 16" fill="none">
                              <path d="M8 1L9.8 5.6L15 6.2L11.2 9.6L12.4 15L8 12.4L3.6 15L4.8 9.6L1 6.2L6.2 5.6L8 1Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}

            {!loading && filteredCoins.length === 0 && (
              <div className="text-center py-16">
                <p className="text-xs tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                  NO ASSETS FOUND
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
