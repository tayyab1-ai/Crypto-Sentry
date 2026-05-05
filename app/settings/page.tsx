// PATH: ask-ai/app/settings/page.tsx

import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
  })

  return (
    <SettingsClient
      user={{
        name: user?.name || session.user?.name || 'Operative',
        email: user?.email || session.user?.email || '',
        // If password_hash exists, user registered via credentials (not Google)
        hasPassword: !!(user as any)?.password_hash,
      }}
    />
  )
}
