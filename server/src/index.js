require('dotenv').config()
const mongoose = require('mongoose')
const { port, mongoUri } = require('./config/app.config')
const { createApp, ensureMongoConnected } = require('./app')

async function main() {
  await ensureMongoConnected()
  console.log('MongoDB connected')

  const app = createApp()
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`)
  })
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
