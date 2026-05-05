import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import WatchlistClient from './WatchlistClient'
import prisma from '@/lib/prisma'

export default async function WatchlistPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: { watchlists: { orderBy: { added_at: 'desc' } } }
  })

  return (
    <WatchlistClient
      watchlistItems={user?.watchlists || []}
      userName={session.user?.name || 'Operator'}
    />
  )
}