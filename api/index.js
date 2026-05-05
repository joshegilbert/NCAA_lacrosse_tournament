/**
 * Vercel serverless entry: same Express app as local `server/src/index.js`.
 * Env vars come from the Vercel project (set MONGO_URI, JWT_SECRET, CLIENT_ORIGIN, etc.).
 */
const { createApp } = require('../server/src/app')

const app = createApp()

/**
 * Our `vercel.json` rewrites `/api/:path*` -> `/api/index`, and Vercel forwards the
 * wildcard as the query param `path` (e.g. `?path=auth/login`).
 * Reconstruct the original URL so Express can match `/api/auth/login`, etc.
 */
module.exports = (req, res) => {
  const p = req.query?.path
  if (p && typeof p === 'string') {
    const clean = p.startsWith('/') ? p.slice(1) : p
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    req.url = `/api/${clean}${qs}`
  }
  return app(req, res)
}
