require('dotenv').config()

/**
 * Default bracket lock: Tuesday May 5, 2026 00:00 Mountain Time.
 * America/Denver: 2026-05-05T00:00:00 => UTC 2026-05-05T06:00:00 (MDT, DST)
 */
const DEFAULT_LOCK_ISO =
  process.env.BRACKET_LOCK_AT || '2026-05-05T06:00:00.000Z'

function getDefaultLockDate() {
  return new Date(DEFAULT_LOCK_ISO)
}

module.exports = {
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/lacrosse_bracket',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  getDefaultLockDate,
}
