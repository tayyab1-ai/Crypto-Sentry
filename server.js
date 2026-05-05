// server.js (root mein)

const express = require('express')
const { PrismaClient } = require('@prisma/client')

const app = express()
const prisma = new PrismaClient()

app.use(express.json())

// CORS — Next.js ko allow karo
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000')
  res.header('Access-Control-Allow-Headers', 'Content-Type')
  next()
})

// ─────────────────────────────────────────
// MEMORY CACHE — Prices yahan store hongi
// ─────────────────────────────────────────
let memoryCache = {
  timestamp: null,
  prices: {},
  activeAlerts: new Set(),
}

// ─────────────────────────────────────────
// BASELINE PRICES — Comparison ke liye
// ─────────────────────────────────────────
let baselinePrices = {}
let lastAlertTime = {}

// ─────────────────────────────────────────
// COINS LIST — Jo monitor karni hain
// ─────────────────────────────────────────
const COINS = [
  'bitcoin', 'ethereum', 'binancecoin', 'solana',
  'cardano', 'xrp', 'dogecoin', 'polygon',
  'avalanche-2', 'chainlink', 'litecoin', 'stellar',
  'uniswap', 'cosmos', 'algorand', 'tron',
  'filecoin', 'vechain', 'theta-token', 'monero'
]

const CRASH_THRESHOLD = -0.5  // -2% ya zyada drop
const SPIKE_THRESHOLD = 0.5   // +2% ya zyada spike
const ALERT_COOLDOWN = 60000  // 60 seconds cooldown

// ─────────────────────────────────────────
// FUNCTION: CoinGecko se prices lao
// ─────────────────────────────────────────
async function fetchPricesFromCoinGecko() {
  const coinIds = COINS.join(',')
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinIds}&vs_currencies=usd&include_24hr_change=true`

  const response = await fetch(url)
  
  if (response.status === 429) {
    // Rate limit — wait karo
    console.log(`[${new Date().toISOString()}] Rate limited by CoinGecko`)
    return null
  }

  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`)
  }

  return await response.json()
}

// ─────────────────────────────────────────
// FUNCTION: Retry logic ke saath fetch
// ─────────────────────────────────────────
async function fetchWithRetry(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const data = await fetchPricesFromCoinGecko()
      if (data) return data
      
      // Rate limited — wait karo
      const waitTime = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, waitTime))
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Attempt ${i + 1} failed:`, error.message)
      if (i === retries - 1) throw error
      
      const waitTime = Math.pow(2, i) * 1000
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }
  return null
}

// ─────────────────────────────────────────
// FUNCTION: Flash Crash + Spike Detect karo
// ─────────────────────────────────────────
async function detectAnomalies(currentPrices) {
  const newAlerts = new Set()

  for (const [assetId, data] of Object.entries(currentPrices)) {
    if (!data || !data.usd) continue

    const currentPrice = data.usd

    // Pehli baar dekh raha hai is coin ko
    if (!baselinePrices[assetId]) {
      baselinePrices[assetId] = currentPrice
      continue
    }

    const baseline = baselinePrices[assetId]
    const changePercent = ((currentPrice - baseline) / baseline) * 100

    // ── CRASH DETECTION (price giri) ──────────────
    if (changePercent <= CRASH_THRESHOLD) {
      const now = Date.now()
      const lastAlert = lastAlertTime[assetId] || 0
      const timeSinceLast = now - lastAlert

      if (timeSinceLast > ALERT_COOLDOWN) {
        // Alert banao
        try {
          await prisma.cryptoAlert.create({
            data: {
              asset_id: assetId,
              asset_name: formatCoinName(assetId),
              price_at_drop: currentPrice,
              drop_percentage: changePercent,
              alert_type: 'CRASH',
            }
          })

          lastAlertTime[assetId] = now
          newAlerts.add(assetId)

          console.log(
            `[${new Date().toISOString()}] 🔴 CRASH | ${assetId.toUpperCase()} | ` +
            `Price: $${currentPrice} | Drop: ${changePercent.toFixed(2)}%`
          )
        } catch (err) {
          console.error(`Alert save karne mein masla:`, err.message)
        }
      }
    }

    // ── SPIKE DETECTION (price bada) ─────────────
    if (changePercent >= SPIKE_THRESHOLD) {
      const now = Date.now()
      const key = `spike_${assetId}`
      const lastSpike = lastAlertTime[key] || 0

      if (now - lastSpike > ALERT_COOLDOWN) {
        try {
          await prisma.cryptoAlert.create({
            data: {
              asset_id: assetId,
              asset_name: formatCoinName(assetId),
              price_at_drop: currentPrice,
              drop_percentage: changePercent,
              alert_type: 'SPIKE',
            }
          })

          lastAlertTime[key] = now

          console.log(
            `[${new Date().toISOString()}] 🟢 SPIKE | ${assetId.toUpperCase()} | ` +
            `Price: $${currentPrice} | Rise: +${changePercent.toFixed(2)}%`
          )
        } catch (err) {
          console.error(`Spike alert save mein masla:`, err.message)
        }
      }
    }

    // Baseline update karo
    baselinePrices[assetId] = currentPrice
  }

  return newAlerts
}

// ─────────────────────────────────────────
// FUNCTION: Coin name format karo
// ─────────────────────────────────────────
function formatCoinName(assetId) {
  const names = {
    'bitcoin': 'Bitcoin',
    'ethereum': 'Ethereum',
    'binancecoin': 'BNB',
    'solana': 'Solana',
    'cardano': 'Cardano',
    'xrp': 'XRP',
    'dogecoin': 'Dogecoin',
    'polygon': 'Polygon',
    'avalanche-2': 'Avalanche',
    'chainlink': 'Chainlink',
    'litecoin': 'Litecoin',
    'stellar': 'Stellar',
  }
  return names[assetId] || assetId
}

// ─────────────────────────────────────────
// MAIN POLLING CYCLE — Har 30 second
// ─────────────────────────────────────────
async function runSurveillanceCycle() {
  console.log(`[${new Date().toISOString()}] 🔄 Surveillance cycle started...`)

  try {
    // Step 1: Prices fetch karo
    const prices = await fetchWithRetry()
    
    if (!prices) {
      console.log(`[${new Date().toISOString()}] ⚠️ Prices not found, skipping thr cycle`)
      return
    }

    // Step 2: Anomalies detect karo
    const alerts = await detectAnomalies(prices)

    // Step 3: Cache update karo
    memoryCache = {
      timestamp: Date.now(),
      prices: prices,
      activeAlerts: alerts,
    }

    console.log(
      `[${new Date().toISOString()}] ✅ Cycle complete | ` +
      `Coins: ${Object.keys(prices).length} | Alerts: ${alerts.size}`
    )

  } catch (error) {
    console.error(`[${new Date().toISOString()}] ❌ Cycle error:`, error.message)
  }
}

// ─────────────────────────────────────────
// API ENDPOINTS
// ─────────────────────────────────────────

// Health check
app.get('/health', (req, res) => {
  const cacheAge = memoryCache.timestamp
    ? Math.floor((Date.now() - memoryCache.timestamp) / 1000)
    : null

  res.json({
    status: 'OK',
    uptime: process.uptime(),
    cache_age_seconds: cacheAge,
    coins_monitored: COINS.length,
    active_alerts: memoryCache.activeAlerts.size,
  })
})

// Cache data (Next.js yahan se lega)
app.get('/cache', (req, res) => {
  if (!memoryCache.timestamp) {
    return res.json({ available: false, prices: {} })
  }

  const cacheAge = Date.now() - memoryCache.timestamp
  const isStale = cacheAge > 60000 // 1 minute se zyada purana

  // Prices mein status add karo
  const enrichedPrices = {}
  for (const [id, data] of Object.entries(memoryCache.prices)) {
    enrichedPrices[id] = {
      ...data,
      name: formatCoinName(id),
      status: memoryCache.activeAlerts.has(id) ? 'alert' : 'stable',
    }
  }

  res.json({
    available: true,
    stale: isStale,
    cache_age_ms: cacheAge,
    timestamp: memoryCache.timestamp,
    prices: enrichedPrices,
  })
})

// ─────────────────────────────────────────
// SERVER START
// ─────────────────────────────────────────
const PORT = process.env.PORT || 4000

app.listen(PORT, async () => {
  console.log(`[${new Date().toISOString()}] 🚀 Surveillance Engine started at port ${PORT}`)

  // Turant pehla cycle chalao
  await runSurveillanceCycle()

  // Har 30 second mein chalao
  setInterval(runSurveillanceCycle, 30000)
})

// ─────────────────────────────────────────
// GRACEFUL SHUTDOWN
// ─────────────────────────────────────────
process.on('SIGTERM', async () => {
  console.log('Server Closing...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGINT', async () => {
  console.log('Server Closing...')
  await prisma.$disconnect()
  process.exit(0)
})