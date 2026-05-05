'use client'
import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Sidebar from '@/components/Sidebar'

interface Alert {
  id: string
  asset_id: string
  asset_name: string
  price_at_drop: number
  drop_percentage: number
  alert_type: string
  detected_at: string
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return `${seconds}s ago`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}min ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}hr ago`
  return `${Math.floor(seconds / 86400)} days ago`
}

export default function AlertsClient() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts?limit=100')
      const data = await res.json()
      setAlerts(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar searchValue="" onSearchChange={() => {}} />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-5 min-w-0">
          
          {/* Header */}
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1L14 13H2L8 1Z" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 6V9" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
                <circle cx="8" cy="11" r="0.75" fill="#22c55e"/>
              </svg>
              <h1 className="text-sm font-bold tracking-widest" style={{ color: 'var(--text-primary)' }}>
                ALERT LOG
              </h1>
            </div>
            <p className="text-[9px] tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              SYSTEM ANOMALY · LIVE STREAM
            </p>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div 
                  key={i} 
                  className="rounded-lg p-4 animate-pulse h-16"
                  style={{ background: 'var(--bg-card)', border: '1px solid var(--border-default)' }}
                />
              ))}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-20">
              <div 
                className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4"
                style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10L8 13L15 6" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="text-xs tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                NO ALERTS DETECTED
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const isCrash = alert.alert_type === 'CRASH'
                const isPositive = alert.drop_percentage > 0
                const symbol = alert.asset_id?.toUpperCase().slice(0, 3) || 'N/A'

                return (
                  <div
                    key={alert.id}
                    className="rounded-lg px-5 py-4 flex items-center justify-between transition-all"
                    style={{
                      background: isCrash ? 'rgba(239,68,68,0.04)' : 'rgba(34,197,94,0.04)',
                      border: `1px solid ${isCrash ? 'rgba(239,68,68,0.2)' : 'rgba(34,197,94,0.15)'}`,
                    }}
                  >
                    {/* Left: Icon + Name + Type */}
                    <div className="flex items-center gap-4">
                      <div 
                        className="w-7 h-7 rounded flex items-center justify-center shrink-0"
                        style={{ 
                          background: isCrash ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                          border: `1px solid ${isCrash ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          {isCrash 
                            ? <path d="M6 1L11 10H1L6 1Z" stroke={isCrash ? '#ef4444' : '#22c55e'} strokeWidth="1.2" strokeLinejoin="round"/>
                            : <path d="M2 8L5 4L8 6L10 2" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                          }
                        </svg>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
                            {symbol} {isCrash ? 'CRITICAL' : 'SPIKE'}
                          </span>
                          <span 
                            className="text-[8px] tracking-widest px-1.5 py-0.5 rounded"
                            style={{ 
                              background: isCrash ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                              color: isCrash ? '#ef4444' : '#22c55e',
                              border: `1px solid ${isCrash ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
                            }}
                          >
                            {alert.alert_type}
                          </span>
                        </div>
                        <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                          {isCrash 
                            ? `Sudden price drop of ${Math.abs(alert.drop_percentage).toFixed(1)}% triggered emergency protocols`
                            : `High-intensity spike detected — liquidity fluctuation`
                          }
                        </div>
                      </div>
                    </div>

                    {/* Right: Price + Change + Time */}
                    <div className="flex items-center gap-8 text-right">
                      <div>
                        <div className="text-xs font-bold" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                          ${alert.price_at_drop.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="text-[9px] font-bold" style={{ color: isPositive ? 'var(--green-bright)' : 'var(--red-alert)' }}>
                          {isPositive ? '▲ +' : '▼ '}{Math.abs(alert.drop_percentage).toFixed(2)}%
                        </div>
                      </div>
                      <div className="text-[9px] tracking-widest min-w-20" style={{ color: 'var(--text-muted)' }}>
                        {timeAgo(alert.detected_at).toUpperCase()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
