import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import prisma from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    // ── 1. Input Validation ──────────────────────────────────
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'All fields are required.' },
        { status: 400 }
      )
    }

    if (name.trim().length < 3) {
      return NextResponse.json(
        { error: 'Name must be at least 3 characters long.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format.' },
        { status: 400 }
      )
    }

    const allowedDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com']
    const domain = email.split('@')[1]?.toLowerCase()
    if (!allowedDomains.includes(domain)) {
      return NextResponse.json(
        { error: 'Only Gmail, Yahoo, Outlook, Hotmail, and iCloud emails are allowed.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters long.' },
        { status: 400 }
      )
    }

    // ── 2. Duplicate Email Check ─────────────────────────────
    const existing = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'This email is already registered.' },
        { status: 400 }
      )
    }

    // ── 3. Password Hash ─────────────────────────────────────
    const hashedPassword = await bcrypt.hash(password, 12)

    // ── 4. User Create ───────────────────────────────────────
    await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase(),
        password_hash: hashedPassword,
      },
    })

    return NextResponse.json(
      { success: true, message: 'Account successfully created.' },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('SIGNUP_ERROR:', error)
    return NextResponse.json(
      { error: 'Server error. Please try again later.' },
      { status: 500 }
    )
  }
}