require('./models/register')
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const { mongoUri } = require('./config/app.config')
const authRoutes = require('./routes/auth')
const leagueRoutes = require('./routes/leagues')
const bracketRoutes = require('./routes/bracket')
const adminRoutes = require('./routes/admin')

function parseCorsOrigins() {
  const raw = process.env.CLIENT_ORIGIN || 'http://localhost:5173'
  const list = String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const set = new Set(list)
  if (process.env.VERCEL_URL) {
    set.add(`https://${process.env.VERCEL_URL}`)
  }
  return [...set]
}

async function ensureMongoConnected() {
  if (mongoose.connection.readyState === 1) return
  await mongoose.connect(mongoUri)
}

/**
 * Express app for local server and Vercel (serverless). Mongo is connected on first request.
 */
function createApp() {
  const app = express()

  const origins = parseCorsOrigins()
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true)
        if (origins.includes(origin)) return cb(null, true)
        try {
          const host = new URL(origin).hostname
          if (host.endsWith('.vercel.app')) return cb(null, true)
        } catch (_) {
          /* ignore */
        }
        return cb(null, false)
      },
      credentials: true,
    })
  )

  app.use(async (req, res, next) => {
    try {
      await ensureMongoConnected()
      next()
    } catch (err) {
      next(err)
    }
  })

  app.use(express.json())

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/leagues', leagueRoutes)
  app.use('/api/bracket', bracketRoutes)
  app.use('/api/admin', adminRoutes)

  return app
}

module.exports = { createApp, ensureMongoConnected }
