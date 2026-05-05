// PATH: ask-ai/app/profile/page.tsx

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import ProfileClient from './ProfileClient'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/login')
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      watchlists: {
        orderBy: { added_at: 'desc' },
      },
    },
  })

  // Agar user DB me nahi mila
  if (!user) {
    redirect('/login')
  }

  const watchedIds = user.watchlists.map((w) => w.asset_id)

  // WHERE clause (reuseable)
  const whereFilter =
    watchedIds.length > 0
      ? { asset_id: { in: watchedIds } }
      : undefined

  return (
    <ProfileClient
      user={{
        name: user.name || session.user.name || 'Operative',
        email: user.email || session.user.email || '',
        image: user.image ?? null,
        hasPassword: !!user.password_hash,
        createdAt: user.created_at
          ? new Date(user.created_at).toISOString()
          : null,
      }}
      watchlistCount={user.watchlists.length}
    />
  )
}