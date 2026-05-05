// PATH: ask-ai/app/api/prices/route.ts
//
// FIX: Price history ab Next.js server ki global memory mein store hoti hai.
// Yeh process restart tak survive karti hai — page refresh ya navigation se
// kabhi reset nahi hogi. Max 50 data points per coin store hote hain.

import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// ─── Global server-side price history store ───────────────────────────────────
// "global" isliye use kiya hai taaki Next.js hot-reload pe bhi persist rahe.
// Yeh object sirf server restart pe reset hoga — aur kisi cheez se nahi.

const MAX_HISTORY_POINTS = 50  // Har coin ke liye max kitne points store karein

declare global {
  // eslint-disable-next-line no-var
  var __priceHistory: Record<string, number[]> | undefined
  var __lastPriceSnapshot: Record<string, number> | undefined
}

// First run pe initialize karo
if (!global.__priceHistory) {
  global.__priceHistory = {}
}
if (!global.__lastPriceSnapshot) {
  global.__lastPriceSnapshot = {}
}

function updateHistory(prices: Record<string, { usd: number }>) {
  for (const [coinId, data] of Object.entries(prices)) {
    if (!data?.usd || data.usd <= 0) continue

    if (!global.__priceHistory![coinId]) {
      global.__priceHistory![coinId] = []
    }

    const history = global.__priceHistory![coinId]
    const lastPrice = history[history.length - 1]

    // Sirf tab push karo jab price change ho (duplicate avoid)
    if (lastPrice !== data.usd) {
      history.push(data.usd)
      // Max points se zyada ho to purane hata do
      if (history.length > MAX_HISTORY_POINTS) {
        global.__priceHistory![coinId] = history.slice(-MAX_HISTORY_POINTS)
      }
    }
  }
}

export async function GET() {
  try {
    const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:4000'

    const cacheRes = await fetch(`${expressUrl}/cache`, {
      next: { revalidate: 0 },
    })

    if (cacheRes.ok) {
      const cacheData = await cacheRes.json()

      if (cacheData.available && cacheData.prices) {
        // ── Naye prices aaye — history update karo ──────────────────────────
        updateHistory(cacheData.prices)

        // ── Response mein history bhi attach karo ───────────────────────────
        return NextResponse.json({
          source: 'cache',
          stale: cacheData.stale,
          timestamp: cacheData.timestamp,
          prices: cacheData.prices,
          history: global.__priceHistory,   // ← Yeh nayi field hai
        })
      }
    }

    // Fallback: DB se alerts
    const recentAlerts = await prisma.cryptoAlert.findMany({
      take: 20,
      orderBy: { detected_at: 'desc' },
    })

    return NextResponse.json({
      source: 'database_fallback',
      stale: true,
      prices: {},
      history: global.__priceHistory,       // ← Fallback mein bhi history bhejo
      fallback_alerts: recentAlerts,
    })

  } catch (error) {
    console.error('Prices API error:', error)
    return NextResponse.json(
      { error: 'Prices not available' },
      { status: 500 }
    )
  }
}