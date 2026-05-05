import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import AlertsClient from './AlertsClient'

export default async function AlertsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  return <AlertsClient />
}