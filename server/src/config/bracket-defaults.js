const Matchup = require('../models/Matchup')
const { getDefaultLockDate } = require('./app.config')

/**
 * Default lock time when creating a league.
 *
 * Prefer: shortly before the first scheduled game (earliest Matchup.scheduledAt).
 * Fallback: BRACKET_LOCK_AT / hardcoded default from app.config, then now + 24h.
 */
async function getDefaultLockTime() {
  try {
    const first = await Matchup.findOne({ scheduledAt: { $ne: null } })
      .sort({ scheduledAt: 1 })
      .select('scheduledAt')
      .lean()
    if (first?.scheduledAt) {
      const d = new Date(first.scheduledAt)
      // 60 minute buffer so league locks shortly before the first game.
      return new Date(d.getTime() - 60 * 60 * 1000)
    }
  } catch (_) {
    // ignore and use fallbacks below
  }

  const fallback = getDefaultLockDate()
  if (fallback && !Number.isNaN(fallback.getTime())) return fallback
  return new Date(Date.now() + 24 * 60 * 60 * 1000)
}

module.exports = {
  getDefaultLockTime,
}
