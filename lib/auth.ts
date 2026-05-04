import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import bcrypt from 'bcryptjs'
import prisma from './prisma'

export const authOptions: NextAuthOptions = {
  cookies: {
    pkceCodeVerifier: {
      name: 'next-auth.pkce.code_verifier',
      options: {
        httpOnly: true,
        sameSite: 'none',
        path: '/',
        secure: false,
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })
        if (!user || !user.password_hash) return null
        const isValid = await bcrypt.compare(credentials.password, user.password_hash)
        if (!isValid) return null
        return { id: user.id, email: user.email, name: user.name }
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      checks: ['state'],  // PKCE disable, sirf state check
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id as string
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        })
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name ?? 'Google User',
            },
          })
        }
      }
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}