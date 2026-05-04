// app/dashboard/page.tsx
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import DashboardClient from './DashboardClient'
import prisma from '@/lib/prisma'

export default async function DashboardPage() {
  // Session check — nahi hai to login pe bhejo
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // User ki watchlist DB se lao
  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: { watchlists: true }
  })

  const initialWatchlist = user?.watchlists.map(w => w.asset_id) || []

  return (
    <DashboardClient 
      userName={session.user?.name || 'Operator'}
      initialWatchlist={initialWatchlist}
    />
  )
}