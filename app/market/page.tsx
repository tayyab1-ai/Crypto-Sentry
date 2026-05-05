import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import MarketClient from './MarketClient'
import prisma from '@/lib/prisma'

export default async function MarketPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: { watchlists: true }
  })

  const initialWatchlist = user?.watchlists.map(w => w.asset_id) || []

  return (
    <MarketClient
      userName={session.user?.name || 'Operator'}
      initialWatchlist={initialWatchlist}
    />
  )
}