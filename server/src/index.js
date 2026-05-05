require('dotenv').config()
const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const { port, mongoUri, clientOrigin } = require('./config/app.config')
require('./models/register')

const authRoutes = require('./routes/auth')
const leagueRoutes = require('./routes/leagues')
const bracketRoutes = require('./routes/bracket')
const adminRoutes = require('./routes/admin')

async function main() {
  await mongoose.connect(mongoUri)
  console.log('MongoDB connected')

  const app = express()
  app.use(cors({ origin: clientOrigin, credentials: true }))
  app.use(express.json())

  app.get('/api/health', (req, res) => {
    res.json({ ok: true })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/leagues', leagueRoutes)
  app.use('/api/bracket', bracketRoutes)
  app.use('/api/admin', adminRoutes)

  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
