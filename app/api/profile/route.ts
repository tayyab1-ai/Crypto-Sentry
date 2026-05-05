// PATH: ask-ai/app/api/profile/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

// ── PATCH: Update user name ──────────────────────────────────────────────────
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const name = (body?.name || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Name is required.' }, { status: 400 })
    }
    if (name.length < 3) {
      return NextResponse.json(
        { error: 'Name must be at least 3 characters.' },
        { status: 400 }
      )
    }
    if (name.length > 50) {
      return NextResponse.json(
        { error: 'Name must be under 50 characters.' },
        { status: 400 }
      )
    }

    const updated = await prisma.user.update({
      where: { email: session.user?.email! },
      data: { name },
    })

    return NextResponse.json({ success: true, name: updated.name })
  } catch (error) {
    console.error('PROFILE_PATCH_ERROR:', error)
    return NextResponse.json({ error: 'Failed to update name.' }, { status: 500 })
  }
}

// ── DELETE: Delete account and all user data ─────────────────────────────────
export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    // Delete watchlists first (in case no cascade)
    await prisma.watchlist.deleteMany({ where: { user_id: user.id } })

    // Delete user
    await prisma.user.delete({ where: { id: user.id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PROFILE_DELETE_ERROR:', error)
    return NextResponse.json({ error: 'Failed to delete account.' }, { status: 500 })
  }
}
