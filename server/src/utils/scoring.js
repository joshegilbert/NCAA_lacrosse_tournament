const scoringConfig = require('../config/scoring.config')
const { picksToMap, getEligibleWinnerIds } = require('./picks')

function pickStatus(matchup, selectedWinnerId, actualWinnerId) {
  if (!actualWinnerId) return 'pending'
  const s = selectedWinnerId?.toString()
  const a = actualWinnerId?.toString()
  if (!s) return 'pending'
  return s === a ? 'correct' : 'incorrect'
}

function pointsForMatchup(matchup, selectedWinnerId, actualWinnerId) {
  if (!actualWinnerId || !selectedWinnerId) return 0
  if (selectedWinnerId.toString() !== actualWinnerId.toString()) return 0
  const tier = matchup.scoringTier
  return scoringConfig[tier] ?? 0
}

/**
 * Score one user's bracket entry against actual winners.
 * @returns {{ totalPoints: number, correct: number, incorrect: number, pending: number, incomplete: number, championTeamId: string|null }}
 */
function scoreEntry(matchups, picks) {
  const byMatchup = {}
  for (const p of picks || []) {
    const mid = p.matchup?._id ? p.matchup._id.toString() : p.matchup?.toString()
    if (mid)
      byMatchup[mid] = p.selectedWinner?._id
        ? p.selectedWinner._id
        : p.selectedWinner
  }

  let totalPoints = 0
  let correct = 0
  let incorrect = 0
  let pending = 0
  let incomplete = 0
  let championTeamId = null

  for (const m of matchups) {
    const mid = m._id.toString()
    const sel = byMatchup[mid]
    const actual = m.actualWinner?._id || m.actualWinner

    if (m.roundKey === 'championship' && sel) {
      championTeamId = sel.toString()
    }

    if (!sel) {
      incomplete += 1
      continue
    }

    const st = pickStatus(m, sel, actual)
    if (st === 'pending') pending += 1
    else if (st === 'correct') {
      correct += 1
      totalPoints += pointsForMatchup(m, sel, actual)
    } else {
      incorrect += 1
    }
  }

  return { totalPoints, correct, incorrect, pending, incomplete, championTeamId }
}

function selectedWinnerNameFromPicks(picks, matchupIdStr) {
  for (const p of picks || []) {
    const mid =
      p.matchup && p.matchup._id ? p.matchup._id.toString() : p.matchup?.toString()
    if (mid !== matchupIdStr) continue
    const sw = p.selectedWinner
    if (sw && typeof sw === 'object' && sw.name) return sw.name
    return null
  }
  return null
}

/**
 * Per-matchup breakdown for UI
 */
function breakdownPicks(matchups, picks) {
  const pickMap = picksToMap(picks)
  return matchups.map((m) => {
    const mid = m._id.toString()
    const wid = pickMap[mid]
    const actual = m.actualWinner?._id || m.actualWinner
    const status = wid ? pickStatus(m, wid, actual) : 'incomplete'
    const pts = wid && actual ? pointsForMatchup(m, wid, actual) : 0
    const eligibleIds = getEligibleWinnerIds(m, pickMap)
    const actualDoc = m.actualWinner && typeof m.actualWinner === 'object' ? m.actualWinner : null
    const t1 = m.team1 && typeof m.team1 === 'object' ? m.team1.name : null
    const t2 = m.team2 && typeof m.team2 === 'object' ? m.team2.name : null
    return {
      matchupId: mid,
      key: m.key,
      roundKey: m.roundKey,
      displayRound: m.displayRound,
      scoringTier: m.scoringTier,
      selectedWinnerId: wid || null,
      selectedWinnerName: wid ? selectedWinnerNameFromPicks(picks, mid) : null,
      actualWinnerId: actual ? actual.toString() : null,
      actualWinnerName: actualDoc?.name || null,
      team1Name: t1,
      team2Name: t2,
      status,
      pointsEarned: pts,
      eligibleWinnerIds: eligibleIds,
    }
  })
}

module.exports = {
  pickStatus,
  pointsForMatchup,
  scoreEntry,
  breakdownPicks,
}
