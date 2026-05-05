/**
 * Vercel serverless entry: same Express app as local `server/src/index.js`.
 * Env vars come from the Vercel project (set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN, etc.).
 */
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '..', 'server', '.env') })

const { createApp } = require('../server/src/app')

const app = createApp()
module.exports = app
