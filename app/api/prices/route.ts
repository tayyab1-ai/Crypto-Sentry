import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    // Express cache se lene ki koshish karo
    const expressUrl = process.env.NEXT_PUBLIC_EXPRESS_URL || 'http://localhost:4000'
    
    const cacheRes = await fetch(`${expressUrl}/cache`, {
      next: { revalidate: 0 }, // Cache mat karo
    })

    if (cacheRes.ok) {
      const cacheData = await cacheRes.json()
      
      if (cacheData.available) {
        return NextResponse.json({
          source: 'cache',
          stale: cacheData.stale,
          timestamp: cacheData.timestamp,
          prices: cacheData.prices,
        })
      }
    }

    // Fallback: Database se recent alerts lo
    const recentAlerts = await prisma.cryptoAlert.findMany({
      take: 20,
      orderBy: { detected_at: 'desc' },
    })

    return NextResponse.json({
      source: 'database_fallback',
      stale: true,
      prices: {},
      fallback_alerts: recentAlerts,
    })

  } catch (error) {
    console.error('Prices API error:', error)
    return NextResponse.json(
      { error: 'Prices nahi aa sakeen' },
      { status: 500 }
    )
  }
}