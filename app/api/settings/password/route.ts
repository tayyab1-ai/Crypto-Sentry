// PATH: ask-ai/app/api/settings/password/route.ts

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

// ── PATCH: Change password ───────────────────────────────────────────────────
export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Login required.' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Both current and new password are required.' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    // Fetch user with password hash
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 })
    }

    const passwordHash = (user as any).password_hash
    if (!passwordHash) {
      return NextResponse.json(
        { error: 'This account uses OAuth login. Password change is not available.' },
        { status: 400 }
      )
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Current password is incorrect.' },
        { status: 400 }
      )
    }

    // Make sure new password is different
    const isSame = await bcrypt.compare(newPassword, passwordHash)
    if (isSame) {
      return NextResponse.json(
        { error: 'New password must be different from current password.' },
        { status: 400 }
      )
    }

    // Hash and save new password
    const newHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { email: session.user?.email! },
      data: { password_hash: newHash } as any,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PASSWORD_CHANGE_ERROR:', error)
    return NextResponse.json(
      { error: 'Failed to update password. Please try again.' },
      { status: 500 }
    )
  }
}
