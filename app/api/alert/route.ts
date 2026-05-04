import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const assetId = searchParams.get('asset')

    const where: any = {}
    if (assetId) where.asset_id = assetId

    const alerts = await prisma.cryptoAlert.findMany({
      where,
      orderBy: { detected_at: 'desc' },
      take: Math.min(limit, 100),
    })

    return NextResponse.json(alerts)
  } catch (error) {
    return NextResponse.json({ error: 'Alerts not found' }, { status: 500 })
  }
}