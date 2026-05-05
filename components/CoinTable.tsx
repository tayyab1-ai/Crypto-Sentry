// PATH: ask-ai/components/CoinTable.tsx
//
// FIX: Sparkline graph history ab server se aati hai (global.__priceHistory).
// Browser mein kuch store nahi hota — page refresh ya navigation se graph
// kabhi reset nahi hoga. History sirf server restart pe reset hogi.

'use client'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Sparkline from './Sparkline'

interface CoinData {
  usd: number
  usd_24h_change: number
  name: string
  status: 'stable' | 'alert'
}

interface Props {
  searchQuery: string
  filter: 'all' | 'watchlist' | 'gainers' | 'losers'
  watchlist: string[]
  onToggleWatchlist: (id: string, name: string) => void
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


// ─── Single Coin Card ─────────────────────────────────────────────────────────
function CoinCard({
  coinId, data, index, isWatched, onToggleWatchlist, onClick,
  priceHistory,
}: {
  coinId: string
  data: CoinData
  index: number
  isWatched: boolean
  onToggleWatchlist: (id: string, name: string) => void
  onClick: () => void
  priceHistory: number[]   // ← server se aaya persistent history
}) {
  const isAlert = data.status === 'alert'
  const change24h = data.usd_24h_change || 0
  const isPositive = change24h >= 0
  const symbol = COIN_SYMBOLS[coinId] || coinId.toUpperCase().slice(0, 4)
  const coinColor = COIN_COLORS[coinId] || '#22c55e'

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className="rounded-lg p-4 cursor-pointer transition-all duration-150 relative overflow-hidden"
      style={{
        background: isAlert ? 'rgba(239,68,68,0.05)' : 'var(--bg-card)',
        border: `1px solid ${isAlert ? 'rgba(239,68,68,0.3)' : 'var(--border-default)'}`,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isAlert
          ? 'rgba(239,68,68,0.5)' : 'var(--border-green-dim)'
        e.currentTarget.style.background = isAlert
          ? 'rgba(239,68,68,0.08)' : 'var(--bg-card-hover)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = isAlert
          ? 'rgba(239,68,68,0.3)' : 'var(--border-default)'
        e.currentTarget.style.background = isAlert
          ? 'rgba(239,68,68,0.05)' : 'var(--bg-card)'
      }}
    >
      {/* Top Row — Name + Star */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
            style={{
              background: `${coinColor}20`,
              border: `1px solid ${coinColor}40`,
            }}
          >
            <img
              src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`}
              alt={symbol}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><text x="50%" y="50%" font-size="12" font-family="sans-serif" font-weight="900" fill="${encodeURIComponent(coinColor)}" dominant-baseline="central" text-anchor="middle">${symbol.slice(0, 1)}</text></svg>`;
              }}
            />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wide"
              style={{ color: 'var(--text-primary)' }}>
              {data.name || coinId}
            </div>
            <div className="text-[9px] tracking-widest"
              style={{ color: 'var(--text-secondary)' }}>
              {symbol}
            </div>
          </div>
        </div>

        {/* Watchlist star */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onToggleWatchlist(coinId, data.name || coinId)
          }}
          className="transition-all hover:scale-110 p-0.5"
          style={{ color: isWatched ? '#f59e0b' : 'var(--text-muted)' }}
        >
          {isWatched ? (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 1L9.8 5.6L15 6.2L11.2 9.6L12.4 15L8 12.4L3.6 15L4.8 9.6L1 6.2L6.2 5.6L8 1Z" />
            </svg>
          ) : (
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L9.8 5.6L15 6.2L11.2 9.6L12.4 15L8 12.4L3.6 15L4.8 9.6L1 6.2L6.2 5.6L8 1Z"
                stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {/* Price */}
      <div className="mb-2">
        <div
          className="text-lg font-bold tracking-tight"
          style={{
            color: 'var(--text-primary)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          ${data.usd?.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </div>
      </div>

      {/* Sparkline + 24h change */}
      <div className="flex items-end justify-between">
        {/* Graph — server se aayi persistent history use hoti hai */}
        <Sparkline values={priceHistory} positive={isPositive} />

        <div className="text-right">
          <div
            className="text-xs font-bold"
            style={{ color: isPositive ? 'var(--green-bright)' : 'var(--red-alert)' }}
          >
            {isPositive ? '▲' : '▼'} {Math.abs(change24h).toFixed(2)}%
          </div>
          <div className="text-[8px] tracking-widest mt-0.5"
            style={{ color: 'var(--text-secondary)' }}>
            24H DELTA
          </div>
        </div>
      </div>

      {/* Status badge */}
      <div className="mt-3 pt-2.5" style={{ borderTop: '1px solid var(--border-default)' }}>
        <div className="flex items-center justify-between">
          <span
            className="text-[8px] tracking-widest px-2 py-0.5 rounded"
            style={{
              color: isAlert ? 'var(--red-alert)' : 'var(--green-bright)',
              background: isAlert
                ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.08)',
              border: `1px solid ${isAlert
                ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.2)'}`,
            }}
          >
            {isAlert ? '⚠ CRASH ALERT' : '● STABLE'}
          </span>
          <span className="text-[8px] tracking-widest"
            style={{ color: 'var(--text-muted)' }}>
            {priceHistory.length} PTS ↗
          </span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main CoinTable ───────────────────────────────────────────────────────────
export default function CoinTable({
  searchQuery, filter, watchlist, onToggleWatchlist,
}: Props) {
  const [prices, setPrices] = useState<Record<string, CoinData>>({})
  // ← history ab server se aata hai, browser mein store nahi hota
  const [history, setHistory] = useState<Record<string, number[]>>({})
  const [loading, setLoading] = useState(true)
  const [stale, setStale] = useState(false)
  const [limit, setLimit] = useState(5)
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchPrices = async () => {
    try {
      const res = await fetch('/api/prices')
      const data = await res.json()

      if (data.prices) {
        setPrices(data.prices)
        setStale(data.stale || false)
        setLastUpdate(new Date())
      }

      // ← Server se aayi persistent history set karo
      // Har API call pe latest history milti hai — no local accumulation
      if (data.history) {
        setHistory(data.history)
      }
    } catch (err) {
      console.error('Prices not fetched:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrices()
    const interval = setInterval(fetchPrices, 5000)
    return () => clearInterval(interval)
  }, [])

  // Time ago helper
  const timeAgo = (date: Date): string => {
    const secs = Math.floor((Date.now() - date.getTime()) / 1000)
    if (secs < 5) return 'just now'
    if (secs < 60) return `${secs}s ago`
    return `${Math.floor(secs / 60)}min ago`
  }

  // ── Filter + Search ──────────────────────────────────────────────────────
  let filteredCoins = Object.entries(prices).filter(([id, data]) => {
    const name = data.name?.toLowerCase() || id
    const symbol = (COIN_SYMBOLS[id] || '').toLowerCase()
    const q = searchQuery.toLowerCase()
    return name.includes(q) || symbol.includes(q) || id.includes(q)
  })

  if (filter === 'watchlist') {
    filteredCoins = filteredCoins.filter(([id]) => watchlist.includes(id))
  } else if (filter === 'gainers') {
    filteredCoins = filteredCoins
      .filter(([, d]) => d.usd_24h_change > 0)
      .sort((a, b) => b[1].usd_24h_change - a[1].usd_24h_change)
  } else if (filter === 'losers') {
    filteredCoins = filteredCoins
      .filter(([, d]) => d.usd_24h_change < 0)
      .sort((a, b) => a[1].usd_24h_change - b[1].usd_24h_change)
  }

  const visibleCoins = filteredCoins.slice(0, limit)

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="rounded-lg p-4 animate-pulse h-36"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-default)',
            }}
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      {/* Stale warning */}
      {stale && (
        <div
          className="rounded-lg px-4 py-2.5 mb-4 text-xs flex items-center gap-2"
          style={{
            background: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.3)',
            color: '#eab308',
          }}
        >
          ⚠ Data may be stale — Check your connection or refresh the page.
        </div>
      )}

      {/* Last update + history info */}
      {lastUpdate && (
        <div className="flex items-center gap-2 mb-4">
          <span className="status-dot online" />
          <span className="text-[10px] tracking-widest"
            style={{ color: 'var(--text-secondary)' }}>
            UPDATED {timeAgo(lastUpdate).toUpperCase()} · AUTO-REFRESH 5s
          </span>
        </div>
      )}

      {/* Coin Blocks Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        <AnimatePresence>
          {visibleCoins.map(([id, data], index) => (
            <CoinCard
              key={id}
              coinId={id}
              data={data}
              index={index}
              isWatched={watchlist.includes(id)}
              onToggleWatchlist={onToggleWatchlist}
              onClick={() => setSelectedCoin(selectedCoin === id ? null : id)}
              // ← Server se aayi history pass karo — [] agar abhi tak koi data nahi
              priceHistory={history[id] || []}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty state */}
      {visibleCoins.length === 0 && (
        <div className="text-center py-16">
          <div className="text-2xl mb-2" style={{ color: 'var(--text-muted)' }}>◎</div>
          <p className="text-xs tracking-widest"
            style={{ color: 'var(--text-secondary)' }}>
            NO ASSETS FOUND
          </p>
        </div>
      )}

      {/* Show more buttons */}
      {filteredCoins.length > limit && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <span className="text-[10px] tracking-widest"
            style={{ color: 'var(--text-secondary)' }}>
            SHOW:
          </span>
          {[5, 10, 20].map((n) => (
            <button
              key={n}
              onClick={() => setLimit(n)}
              className="px-3 py-1 rounded text-[10px] tracking-widest transition-all"
              style={{
                background: limit === n ? 'var(--green-glow)' : 'var(--bg-card)',
                border: `1px solid ${limit === n
                  ? 'var(--border-green)' : 'var(--border-default)'}`,
                color: limit === n ? 'var(--green-bright)' : 'var(--text-secondary)',
              }}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setLimit(filteredCoins.length)}
            className="px-3 py-1 rounded text-[10px] tracking-widest transition-all"
            style={{
              background: limit >= filteredCoins.length
                ? 'var(--green-glow)' : 'var(--bg-card)',
              border: `1px solid ${limit >= filteredCoins.length
                ? 'var(--border-green)' : 'var(--border-default)'}`,
              color: limit >= filteredCoins.length
                ? 'var(--green-bright)' : 'var(--text-secondary)',
            }}
          >
            ALL ({filteredCoins.length})
          </button>
        </div>
      )}

      {/* Coin detail modal */}
      <AnimatePresence>
        {selectedCoin && prices[selectedCoin] && (
          <CoinDetailModal
            coinId={selectedCoin}
            data={prices[selectedCoin]}
            isWatched={watchlist.includes(selectedCoin)}
            onClose={() => setSelectedCoin(null)}
            onToggleWatchlist={onToggleWatchlist}
            priceHistory={history[selectedCoin] || []}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Coin Detail Modal ────────────────────────────────────────────────────────
function CoinDetailModal({
  coinId, data, isWatched, onClose, onToggleWatchlist, priceHistory,
}: any) {
  const change24h = data.usd_24h_change || 0
  const isAlert = data.status === 'alert'
  const isPositive = change24h >= 0
  const symbol = COIN_SYMBOLS[coinId] || coinId.toUpperCase()
  const coinColor = COIN_COLORS[coinId] || '#22c55e'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="rounded-xl p-6 w-80 shadow-2xl"
        style={{
          background: 'var(--bg-card)',
          border: `1px solid ${isAlert
            ? 'rgba(239,68,68,0.4)' : 'var(--border-green-dim)'}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden"
              style={{
                background: `${coinColor}20`,
                border: `1px solid ${coinColor}40`,
              }}
            >
              <img
                src={`https://assets.coincap.io/assets/icons/${symbol.toLowerCase()}@2x.png`}
                alt={symbol}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36"><text x="50%" y="50%" font-size="16" font-family="sans-serif" font-weight="900" fill="${encodeURIComponent(coinColor)}" dominant-baseline="central" text-anchor="middle">${symbol.slice(0, 1)}</text></svg>`;
                }}
              />
            </div>
            <div>
              <div className="font-bold text-sm"
                style={{ color: 'var(--text-primary)' }}>
                {data.name}
              </div>
              <div className="text-[9px] tracking-widest"
                style={{ color: 'var(--text-secondary)' }}>
                {symbol}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-xs transition-colors"
            style={{ color: 'var(--text-secondary)' }}>
            ✕
          </button>
        </div>

        {/* Sparkline in modal */}
        <div
          className="rounded-lg p-3 mb-3 flex items-center justify-between"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div>
            <div className="text-[9px] tracking-widest mb-1"
              style={{ color: 'var(--text-secondary)' }}>
              PRICE TREND
            </div>
            <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
              {priceHistory.length} data point{priceHistory.length !== 1 ? 's' : ''}
            </div>
          </div>
          <Sparkline values={priceHistory} positive={isPositive} />
        </div>

        {/* Price */}
        <div
          className="rounded-lg p-4 mb-3"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-default)',
          }}
        >
          <div className="text-[9px] tracking-widest mb-1"
            style={{ color: 'var(--text-secondary)' }}>
            CURRENT PRICE
          </div>
          <div
            className="text-2xl font-bold"
            style={{
              color: 'var(--text-primary)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            ${data.usd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div
            className="rounded-lg p-3"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="text-[9px] tracking-widest mb-1"
              style={{ color: 'var(--text-secondary)' }}>
              30s STATUS
            </div>
            <div className="text-xs font-bold"
              style={{
                color: isAlert ? 'var(--red-alert)' : 'var(--green-bright)',
              }}
            >
              {isAlert ? '⚠ CRASH' : '● STABLE'}
            </div>
          </div>
          <div
            className="rounded-lg p-3"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
            }}
          >
            <div className="text-[9px] tracking-widest mb-1"
              style={{ color: 'var(--text-secondary)' }}>
              24H CHANGE
            </div>
            <div
              className="text-xs font-bold"
              style={{
                color: isPositive ? 'var(--green-bright)' : 'var(--red-alert)',
              }}
            >
              {isPositive ? '▲ +' : '▼ '}
              {Math.abs(change24h).toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Watchlist button */}
        <button
          onClick={() => onToggleWatchlist(coinId, data.name)}
          className="w-full py-2.5 rounded-lg text-xs font-bold
                     tracking-widest transition-all"
          style={isWatched ? {
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid rgba(245,158,11,0.3)',
            color: '#f59e0b',
          } : {
            background: 'var(--green-glow)',
            border: '1px solid var(--border-green)',
            color: 'var(--green-bright)',
          }}
        >
          {isWatched ? '★ REMOVE FROM WATCHLIST' : '☆ ADD TO WATCHLIST'}
        </button>
      </motion.div>
    </motion.div>
  )
}