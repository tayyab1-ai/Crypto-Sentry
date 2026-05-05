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

export default function AlertsClient() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // ⬇️ FETCH WATCHLIST
  const fetchWatchlist = async () => {
    const res = await fetch('/api/watchlist')
    const data = await res.json()

    // assuming structure: [{ asset_id: "btc" }]
    const ids = data.map((item: any) => item.asset_id)
    setWatchlist(ids)
  }

  // ⬇️ FETCH ALERTS + FILTER
  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alert?limit=100')
      const data = await res.json()

      // 🔥 FILTER BASED ON WATCHLIST
      const filtered = data.filter((alert: Alert) =>
        watchlist.includes(alert.asset_id)
      )

      setAlerts(filtered)
    } finally {
      setLoading(false)
    }
  }

  // ⬇️ INITIAL LOAD
  useEffect(() => {
    const init = async () => {
      await fetchWatchlist()
    }
    init()
  }, [])

  // ⬇️ AUTO UPDATE BOTH (VERY IMPORTANT)
  useEffect(() => {
    if (watchlist.length === 0) {
      setAlerts([])
      return
    }

    fetchAlerts()

    const interval = setInterval(() => {
      fetchWatchlist()
      fetchAlerts()
    }, 10000)

    return () => clearInterval(interval)
  }, [watchlist])

  // ⬇️ TIME FORMAT
  const timeAgo = (dateStr: string): string => {
    const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}min ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}hr ago`
    return `${Math.floor(seconds / 86400)} days ago`
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar searchValue="" onSearchChange={() => {}} />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-5 min-w-0">
          
          <div className="mb-5">
            <h1 className="text-sm font-bold tracking-widest text-white">
              ALERT LOG (WATCHLIST)
            </h1>
          </div>

          {loading ? (
            <p className="text-xs text-gray-400">Loading...</p>
          ) : alerts.length === 0 ? (
            <p className="text-xs text-gray-400">
              No alerts for your watchlist
            </p>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert) => {
                const isCrash = alert.alert_type === 'CRASH'
                const isPositive = alert.drop_percentage > 0

                return (
                  <div
                    key={alert.id}
                    className="rounded-lg px-5 py-4 flex justify-between"
                    style={{
                      background: isCrash ? 'rgba(239,68,68,0.05)' : 'rgba(34,197,94,0.05)',
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div>
                      <div className="text-xs font-bold text-white">
                        {alert.asset_id.toUpperCase()}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {alert.alert_type}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-white">
                        ${alert.price_at_drop}
                      </div>
                      <div
                        className="text-[10px]"
                        style={{
                          color: isPositive ? '#22c55e' : '#ef4444'
                        }}
                      >
                        {alert.drop_percentage}%
                      </div>
                      <div className="text-[9px] text-gray-500">
                        {timeAgo(alert.detected_at)}
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