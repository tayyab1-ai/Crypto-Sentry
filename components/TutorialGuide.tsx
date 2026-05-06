// PATH: ask-ai/components/TutorialGuide.tsx
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  {
    targetId: 'dashboard-stats',
    title: 'Dashboard Overview 📊',
    message: 'This is your main surveillance dashboard. All coin prices are displayed here.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="1" width="6" height="6" rx="1" stroke="#22c55e" strokeWidth="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1" stroke="#22c55e" strokeWidth="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1" stroke="#22c55e" strokeWidth="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1" stroke="#22c55e" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    targetId: 'search-bar',
    title: 'Coin Search 🔍',
    message: 'Type any coin name or symbol here — for example, "Bitcoin" or "BTC".',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="7" cy="7" r="5" stroke="#22c55e" strokeWidth="1.5"/>
        <path d="M11 11L14 14" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    targetId: 'filter-tabs',
    title: 'Filters 🎯',
    message: 'Filter your watchlist coins, top gainers, or losers.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 4H14M4 8H12M6 12H10" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    targetId: 'nav-alerts',
    title: 'Alerts Page 🚨',
    message: 'This is where you can view the history of all flash crashes and price spikes.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1L14 13H2L8 1Z" stroke="#22c55e" strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M8 6V9" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="8" cy="11" r="0.75" fill="#22c55e"/>
      </svg>
    ),
  },
  {
    targetId: 'user-menu',
    title: 'Your Profile 👤',
    message: 'This is where you can view your profile information and logout.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="5" r="3" stroke="#22c55e" strokeWidth="1.5"/>
        <path d="M2 14C2 11.2 4.7 9 8 9C11.3 9 14 11.2 14 14" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export default function TutorialGuide({ userName, initialDone }: { userName: string, initialDone?: boolean }) {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    if (!initialDone) {
      setTimeout(() => setActive(true), 1000)
    }
  }, [initialDone])

  const updateRect = () => {
    const el = document.getElementById(STEPS[step].targetId)
    if (el) {
      setTargetRect(el.getBoundingClientRect())
    }
  }

  useEffect(() => {
    if (!active) return

    const el = document.getElementById(STEPS[step].targetId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    // Since scroll is smooth, poll for position updates
    const intervalId = setInterval(updateRect, 50)
    setTimeout(() => clearInterval(intervalId), 1000)
    
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect)

    return () => {
      clearInterval(intervalId)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect)
    }
  }, [step, active])

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      finish()
    }
  }

  const finish = async () => {
    setActive(false)
    try {
      await fetch('/api/tutorial', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: true })
      })
    } catch(e) {}
  }

  if (!active) return null

  const currentStep = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  const getTooltipPosition = () => {
    if (!targetRect) return { top: '50%', left: '50%', x: '-50%', y: '-50%' }
    
    let left = targetRect.right + 24
    let top = targetRect.top
    let x = '0%'
    let y = '0%'
    
    // If it overflows right, put it on the left
    if (left + 300 > window.innerWidth) {
      left = targetRect.left - 24
      x = '-100%'
      // If it also overflows left, put it below
      if (left - 300 < 0) {
        left = targetRect.left + (targetRect.width / 2)
        x = '-50%'
        top = targetRect.bottom + 24
      }
    }

    // Ensure it doesn't overflow bottom
    if (top + 250 > window.innerHeight) {
      top = window.innerHeight - 250 - 24
    }
    
    // Ensure it doesn't overflow top
    if (top < 24) {
      top = 24
    }

    return { top, left, x, y }
  }

  const tooltipPos = getTooltipPosition()

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Dark overlay */}
        <div
          className="absolute inset-0 pointer-events-auto transition-all duration-500"
          style={{ background: 'rgba(0,0,0,0.6)' }}
        />

        {/* Green glowing border around highlighted element */}
        {targetRect && (
          <motion.div
            animate={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="absolute rounded-xl z-10"
            style={{
              border: '1.5px solid #22c55e',
              boxShadow: '0 0 0 9999px rgba(0,0,0,0.6), 0 0 24px rgba(34,197,94,0.5), inset 0 0 12px rgba(34,197,94,0.08)',
            }}
          />
        )}

        {/* Tooltip card — positioned to the right of the highlighted element */}
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            top: tooltipPos.top,
            left: tooltipPos.left,
            x: tooltipPos.x,
            y: tooltipPos.y
          }}
          transition={{ duration: 0.2 }}
          className="absolute z-20 pointer-events-auto"
        >
          <div
            className="w-72 rounded-xl p-5 shadow-2xl"
            style={{
              background: '#0f120f',
              border: '1px solid #166534',
              boxShadow: '0 0 32px rgba(34,197,94,0.12)',
            }}
          >
            {/* Header row — icon + title + skip */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {/* Icon badge */}
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(34,197,94,0.1)',
                    border: '1px solid rgba(34,197,94,0.3)',
                  }}
                >
                  {currentStep.icon}
                </div>
                <span
                  className="text-[10px] tracking-widest font-bold uppercase"
                  style={{ color: '#22c55e' }}
                >
                  {currentStep.title}
                </span>
              </div>
              <button
                onClick={finish}
                className="text-[9px] tracking-widest ml-2 shrink-0 transition-colors"
                style={{ color: '#3a4a3a' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#6b7a6b')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#3a4a3a')}
              >
                SKIP GUIDE
              </button>
            </div>

            {/* Progress bar */}
            <div
              className="h-px w-full mb-4 rounded-full overflow-hidden"
              style={{ background: '#1e2b1e' }}
            >
              <motion.div
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
                className="h-full rounded-full"
                style={{ background: '#22c55e' }}
              />
            </div>

            {/* Progress dots */}
            <div className="flex items-center gap-1.5 mb-4">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className="rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? '16px' : '5px',
                    height: '5px',
                    background: i <= step ? '#22c55e' : '#1e2b1e',
                  }}
                />
              ))}
            </div>

            {/* Message text */}
            <p
              className="text-[10px] leading-relaxed mb-5 tracking-wide uppercase"
              style={{ color: '#6b7a6b' }}
            >
              {currentStep.message}
            </p>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="text-[9px] tracking-widest font-bold transition-colors
                           disabled:opacity-25"
                style={{ color: '#6b7a6b' }}
                onMouseEnter={(e) => {
                  if (step > 0) e.currentTarget.style.color = '#e2e8e2'
                }}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7a6b')}
              >
                ← BACK
              </button>

              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-lg text-[10px] font-bold
                           tracking-widest transition-all"
                style={{
                  background: '#22c55e',
                  color: '#0a0c0a',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#16a34a'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#22c55e'
                }}
              >
                {step === STEPS.length - 1 ? 'GOT IT →' : 'NEXT →'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
