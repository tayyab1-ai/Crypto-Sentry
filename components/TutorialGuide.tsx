// components/TutorialGuide.tsx
'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const STEPS = [
  {
    targetId: 'dashboard-stats',
    title: 'Dashboard Overview 📊',
    message: 'This is your main surveillance dashboard. All coin prices are displayed here.',
  },
  {
    targetId: 'search-bar',
    title: 'Coin Search 🔍',
    message: 'Type any coin name or symbol here — for example, "Bitcoin" or "BTC".',
  },
  {
    targetId: 'filter-tabs',
    title: 'Filters 🎯',
    message: 'Filter your watchlist coins, top gainers, or losers.',
  },
  {
    targetId: 'nav-alerts',
    title: 'Alerts Page 🚨',
    message: 'This is where you can view the history of all flash crashes and price spikes.',
  },
  {
    targetId: 'user-menu',
    title: 'Your Profile 👤',
    message: 'This is where you can view your profile information and logout.'
  },
]

export default function TutorialGuide({ userName }: { userName: string }) {
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null)

  useEffect(() => {
    // Pehli baar hai?
    const done = localStorage.getItem('tutorial_done')
    if (!done) {
      setTimeout(() => setActive(true), 1000) // 1 sec baad start
    }
  }, [])

  useEffect(() => {
    if (!active) return
    
    // Target element dhundo
    const el = document.getElementById(STEPS[step].targetId)
    if (el) {
      const rect = el.getBoundingClientRect()
      setTargetRect(rect)
      
      // Element visible karo
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [step, active])

  const handleNext = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      finish()
    }
  }

  const finish = () => {
    localStorage.setItem('tutorial_done', 'true')
    setActive(false)
  }

  if (!active) return null

  const currentStep = STEPS[step]

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 pointer-events-none"
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/75 pointer-events-auto" />

        {/* Highlighted Element Border */}
        {targetRect && (
          <motion.div
            animate={{
              top: targetRect.top - 6,
              left: targetRect.left - 6,
              width: targetRect.width + 12,
              height: targetRect.height + 12,
            }}
            transition={{ duration: 0.3 }}
            className="absolute border-2 border-cyan-400 rounded-xl z-10 
                       shadow-[0_0_20px_rgba(34,211,238,0.5)]"
            style={{ boxShadow: '0 0 0 9999px rgba(0,0,0,0.75)' }}
          />
        )}

        {/* Tooltip Box */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute z-20 pointer-events-auto"
          style={{
            top: targetRect ? Math.min(targetRect.bottom + 20, window.innerHeight - 200) : '50%',
            left: targetRect ? Math.max(10, Math.min(targetRect.left, window.innerWidth - 350)) : '50%',
          }}
        >
          <div className="bg-gray-900 border border-cyan-700 rounded-xl p-5 w-80 shadow-2xl">
            {/* Step Counter */}
            <div className="flex justify-between items-center mb-3">
              <span className="text-cyan-400 text-xs font-medium">
                Step {step + 1} / {STEPS.length}
              </span>
              <button
                onClick={finish}
                className="text-gray-500 hover:text-gray-300 text-xs"
              >
                Skip Tutorial ✕
              </button>
            </div>

            {/* Progress Bar */}
            <div className="bg-gray-700 rounded-full h-1 mb-4">
              <div
                className="bg-cyan-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              />
            </div>

            {/* Content */}
            <h3 className="text-white font-bold text-lg mb-2">
              {currentStep.title}
            </h3>
            <p className="text-gray-300 text-sm mb-5">
              {currentStep.message}
            </p>

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep(Math.max(0, step - 1))}
                disabled={step === 0}
                className="text-gray-400 hover:text-white text-sm 
                           disabled:opacity-30 disabled:cursor-not-allowed"
              >
                ← Back
              </button>

              <button
                onClick={handleNext}
                className="bg-cyan-600 hover:bg-cyan-500 text-white 
                           px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {step === STEPS.length - 1 ? '✓ Finish' : 'Next Step →'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}