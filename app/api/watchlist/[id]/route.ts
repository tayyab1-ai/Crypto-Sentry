import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 })
  }

  try {
    const assetId = params.id

    const user = await prisma.user.findUnique({
      where: { email: session.user?.email! }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not Found.' }, { status: 404 })
    }

    // Delete karo — sirf agar is user ka hai
    await prisma.watchlist.deleteMany({
      where: {
        user_id: user.id,
        asset_id: assetId,
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Could not delete from watchlist.' }, { status: 500 })
  }
}