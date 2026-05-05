const Matchup = require('../models/Matchup')
const LeagueMatchupResult = require('../models/LeagueMatchupResult')

const TEAM_FIELDS = 'name logoUrl record conference seed slug'

/**
 * Same populate chain as GET /api/bracket/league/:leagueId/matchups for consistent client shape.
 */
async function fetchTemplateMatchupsPopulated() {
  return Matchup.find({})
    .populate({ path: 'team1', select: TEAM_FIELDS })
    .populate({ path: 'team2', select: TEAM_FIELDS })
    .populate({ path: 'actualWinner', select: TEAM_FIELDS })
    .populate({
      path: 'nextMatchup',
      select: 'key displayRound roundKey',
    })
    .populate({
      path: 'feederForTeam1',
      select: 'key roundKey displayRound team1 team2 actualWinner',
      populate: [
        { path: 'team1', select: TEAM_FIELDS },
        { path: 'team2', select: TEAM_FIELDS },
        { path: 'actualWinner', select: TEAM_FIELDS },
      ],
    })
    .populate({
      path: 'feederForTeam2',
      select: 'key roundKey displayRound team1 team2 actualWinner',
      populate: [
        { path: 'team1', select: TEAM_FIELDS },
        { path: 'team2', select: TEAM_FIELDS },
        { path: 'actualWinner', select: TEAM_FIELDS },
      ],
    })
    .sort({ roundOrder: 1, position: 1 })
}

/**
 * Map matchupId string -> populated actualWinner Team doc (or null if explicitly absent).
 * Only keys present in LeagueMatchupResult for this league are winners; all other matchups are treated as no result yet.
 */
async function loadLeagueResultWinnerMap(leagueId) {
  const rows = await LeagueMatchupResult.find({ league: leagueId }).populate('actualWinner', TEAM_FIELDS)
  const map = new Map()
  for (const r of rows) {
    map.set(r.matchup.toString(), r.actualWinner || null)
  }
  return map
}

function walkApplyLeagueWinners(node, resultByMid) {
  if (!node || !node._id) return
  const id = node._id.toString()
  if (resultByMid.has(id)) {
    node.actualWinner = resultByMid.get(id)
  } else {
    node.actualWinner = null
  }
  if (node.feederForTeam1 && typeof node.feederForTeam1 === 'object' && node.feederForTeam1._id) {
    walkApplyLeagueWinners(node.feederForTeam1, resultByMid)
  }
  if (node.feederForTeam2 && typeof node.feederForTeam2 === 'object' && node.feederForTeam2._id) {
    walkApplyLeagueWinners(node.feederForTeam2, resultByMid)
  }
}

/**
 * Plain objects with actualWinner taken only from LeagueMatchupResult (never Matchup.actualWinner).
 */
async function getMatchupsMergedForLeague(leagueId) {
  const [docs, resultByMid] = await Promise.all([
    fetchTemplateMatchupsPopulated(),
    loadLeagueResultWinnerMap(leagueId),
  ])
  const plain = docs.map((d) => d.toObject({ flattenMaps: false }))
  for (const m of plain) {
    walkApplyLeagueWinners(m, resultByMid)
  }
  return plain
}

/** Flat index of every matchup node (including nested feeders) for admin validation. */
function flattenMatchupsById(topLevel) {
  const byId = {}
  function walk(m) {
    if (!m || !m._id) return
    byId[m._id.toString()] = m
    if (m.feederForTeam1 && m.feederForTeam1._id) walk(m.feederForTeam1)
    if (m.feederForTeam2 && m.feederForTeam2._id) walk(m.feederForTeam2)
  }
  for (const m of topLevel) walk(m)
  return byId
}

module.exports = {
  fetchTemplateMatchupsPopulated,
  getMatchupsMergedForLeague,
  flattenMatchupsById,
  loadLeagueResultWinnerMap,
}
