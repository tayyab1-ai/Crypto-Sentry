import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

const handler = NextAuth(authOptions)

// Next.js 13+ App Router: GET aur POST dono export karo
export { handler as GET, handler as POST }