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
  if (!mongoUri) {
    const err = new Error(
      'MONGO_URI is not set. In Vercel: Project → Settings → Environment Variables → add MONGO_URI (MongoDB Atlas connection string).'
    )
    err.statusCode = 503
    throw err
  }
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

  // Liveness only — does not open MongoDB (so routing works even when Atlas/env is wrong).
  app.get('/api/health', (req, res) => {
    const configured = Boolean(mongoUri)
    const connected = mongoose.connection.readyState === 1
    res.json({
      ok: true,
      mongo: { configured, connected, readyState: mongoose.connection.readyState },
    })
  })

  app.use(async (req, res, next) => {
    try {
      await ensureMongoConnected()
      next()
    } catch (err) {
      next(err)
    }
  })

  app.use(express.json())

  app.use('/api/auth', authRoutes)
  app.use('/api/leagues', leagueRoutes)
  app.use('/api/bracket', bracketRoutes)
  app.use('/api/admin', adminRoutes)

  app.use((err, req, res, next) => {
    if (res.headersSent) return next(err)
    console.error(err)
    const status = Number(err.statusCode) >= 400 && Number(err.statusCode) < 600 ? err.statusCode : 500
    res.status(status).json({ error: err.message || 'Server error' })
  })

  return app
}

module.exports = { createApp, ensureMongoConnected }
