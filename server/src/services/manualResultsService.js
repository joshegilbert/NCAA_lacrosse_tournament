const LeagueMatchupResult = require('../models/LeagueMatchupResult')
const { isValidAdminWinnerChoice } = require('../utils/adminMatchup')
const { getMatchupsMergedForLeague, flattenMatchupsById } = require('../utils/leagueMatchupMerge')

async function setMatchupWinner(leagueId, matchupId, teamId) {
  const mergedTop = await getMatchupsMergedForLeague(leagueId)
  const byId = flattenMatchupsById(mergedTop)
  const m = byId[matchupId.toString()]
  if (!m) return { error: 'Matchup not found' }
  if (!isValidAdminWinnerChoice(m, teamId, byId)) {
    return { error: 'That team is not in this matchup yet. Set earlier round winners first.' }
  }
  await LeagueMatchupResult.findOneAndUpdate(
    { league: leagueId, matchup: matchupId },
    { $set: { league: leagueId, matchup: matchupId, actualWinner: teamId } },
    { upsert: true, new: true }
  )
  return { ok: true }
}

async function bulkSetWinners(leagueId, updates) {
  for (const u of updates) {
    const r = await setMatchupWinner(leagueId, u.matchupId, u.teamId)
    if (r.error) return r
  }
  return { ok: true }
}

module.exports = { setMatchupWinner, bulkSetWinners }
