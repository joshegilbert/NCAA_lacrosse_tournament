const mongoose = require('mongoose')

/**
 * Build map matchupId (string) -> selectedWinner id (string)
 * @param {{ matchup: any, selectedWinner: any }[]} picks
 */
function picksToMap(picks) {
  const map = {}
  for (const p of picks || []) {
    const mid =
      p.matchup && p.matchup._id ? p.matchup._id.toString() : p.matchup?.toString()
    const wid =
      p.selectedWinner && p.selectedWinner._id
        ? p.selectedWinner._id.toString()
        : p.selectedWinner?.toString()
    if (mid && wid) map[mid] = wid
  }
  return map
}

/**
 * Which teams can be picked as winner for this matchup given prior picks.
 * @param {object} m matchup plain or doc with team1, team2, feeder ids
 * @param {Record<string, string>} pickMap
 */
function getEligibleWinnerIds(m, pickMap) {
  const ids = new Set()
  const add = (id) => {
    if (id && id.toString) ids.add(id.toString())
  }
  if (m.team1) add(m.team1._id || m.team1)
  if (m.team2) add(m.team2._id || m.team2)
  const f1 = m.feederForTeam1 && (m.feederForTeam1._id || m.feederForTeam1)
  const f2 = m.feederForTeam2 && (m.feederForTeam2._id || m.feederForTeam2)
  if (f1) {
    const w = pickMap[f1.toString()]
    if (w) add(w)
  }
  if (f2) {
    const w = pickMap[f2.toString()]
    if (w) add(w)
  }
  return [...ids]
}

/**
 * Validate each pick: winner is eligible for that matchup given other picks in same payload.
 * @param {object[]} matchups populated list
 * @param {{ matchupId: string, selectedWinnerId: string }[]} incoming
 */
function validatePicksAgainstMatchups(matchups, incoming) {
  const byId = {}
  for (const x of matchups) {
    byId[x._id.toString()] = x
  }
  const combinedMap = {}
  for (const row of incoming) {
    const mid = row.matchupId?.toString()
    const wid = row.selectedWinnerId?.toString()
    if (mid && wid) combinedMap[mid] = wid
  }

  const errors = []
  for (const row of incoming) {
    const mid = row.matchupId?.toString()
    const wid = row.selectedWinnerId?.toString()
    if (!mid || !mongoose.Types.ObjectId.isValid(mid)) {
      errors.push('Invalid matchup id')
      continue
    }
    if (!wid || !mongoose.Types.ObjectId.isValid(wid)) {
      errors.push('Invalid winner id')
      continue
    }
    const m = byId[mid]
    if (!m) {
      errors.push(`Unknown matchup ${mid}`)
      continue
    }
    const eligible = getEligibleWinnerIds(m, combinedMap)
    if (!eligible.includes(wid)) {
      errors.push(`Pick not allowed for matchup ${m.key || mid}`)
    }
  }
  return errors
}

module.exports = { picksToMap, getEligibleWinnerIds, validatePicksAgainstMatchups }
