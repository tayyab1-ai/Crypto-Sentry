import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET — User ki watchlist lao
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
      include: {
        watchlists: { orderBy: { added_at: 'desc' } }
      }
    })

    return NextResponse.json(user?.watchlists || [])
  } catch (error) {
    return NextResponse.json({ error: 'Watchlist nahi mili' }, { status: 500 })
  }
}

// POST — Watchlist mein add karo
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  try {
    const { asset_id, asset_name } = await request.json()

    if (!asset_id || !asset_name) {
      return NextResponse.json({ error: 'asset_id aur asset_name chahiye' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not Found.' }, { status: 404 })
    }

    // Try to create — unique constraint handle karo
    const watchlistItem = await prisma.watchlist.upsert({
      where: {
        user_id_asset_id: { user_id: user.id, asset_id }
      },
      update: {},
      create: { user_id: user.id, asset_id, asset_name }
    })

    return NextResponse.json(watchlistItem, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Could not add to watchlist.' }, { status: 500 })
  }
}