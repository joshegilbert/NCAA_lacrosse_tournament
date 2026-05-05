/**
 * @param {import('../models/League').LeagueDoc | null} league
 * @param {Date} [now]
 */
function isLeagueLocked(league, now = new Date()) {
  if (!league) return true
  if (league.isLocked) return true
  if (league.manualUnlockUntil && now < new Date(league.manualUnlockUntil)) return false
  if (league.lockTime && now >= new Date(league.lockTime)) return true
  return false
}

module.exports = { isLeagueLocked }
