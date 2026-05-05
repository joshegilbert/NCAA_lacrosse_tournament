import { resolveOfficialSide, teamIdStr } from './officialBracket'

/** @param {object} t */
function teamId(t) {
  if (!t) return null
  return (t._id || t).toString()
}

/**
 * Build matchup id -> doc map (includes nested feeders) for resolveOfficialSide / pick resolution.
 */
export function buildMatchupsById(matchups) {
  const m = {}
  function walk(node) {
    if (!node || !node._id) return
    m[node._id.toString()] = node
    if (node.feederForTeam1 && node.feederForTeam1._id) walk(node.feederForTeam1)
    if (node.feederForTeam2 && node.feederForTeam2._id) walk(node.feederForTeam2)
  }
  for (const x of matchups || []) walk(x)
  return m
}

/** Teams eliminated by an entered actual result (losers of decided games in the real bracket). */
export function buildEliminatedTeamIds(matchupsById) {
  const eliminated = new Set()
  for (const node of Object.values(matchupsById)) {
    if (!node?.actualWinner) continue
    const winId = teamIdStr(node.actualWinner)
    if (!winId) continue
    const t1 = resolveOfficialSide(node, 1, matchupsById)
    const t2 = resolveOfficialSide(node, 2, matchupsById)
    const id1 = teamIdStr(t1)
    const id2 = teamIdStr(t2)
    if (id1 && id1 !== winId) eliminated.add(id1)
    if (id2 && id2 !== winId) eliminated.add(id2)
  }
  return eliminated
}

/**
 * User's pick for this matchup as a team document (recursive; fixes feeder slots).
 */
export function resolvePickToTeam(matchupId, pickMap, matchupsById) {
  const mid = matchupId?.toString?.() ?? String(matchupId)
  const wid = pickMap[mid]
  if (!wid) return null
  const m = matchupsById[mid]
  if (!m) return { _id: wid, name: 'Team' }
  const left = resolveCompetitor(m, 1, pickMap, matchupsById)
  const right = resolveCompetitor(m, 2, pickMap, matchupsById)
  const w = wid.toString()
  if (left && teamId(left) === w) return left
  if (right && teamId(right) === w) return right
  return { _id: wid, name: 'Team' }
}

/**
 * Resolved competitor in slot 1 or 2 from user's picks (recursive).
 */
export function resolveCompetitor(m, slot, pickMap, matchupsById) {
  if (slot === 1) {
    if (m.team1) return m.team1
    const f = m.feederForTeam1?._id || m.feederForTeam1
    if (f) return resolvePickToTeam(f.toString(), pickMap, matchupsById)
    return null
  }
  if (m.team2) return m.team2
  const f = m.feederForTeam2?._id || m.feederForTeam2
  if (f) return resolvePickToTeam(f.toString(), pickMap, matchupsById)
  return null
}

/** @deprecated use resolveCompetitor — kept alias */
export function resolveSlot(m, slot, pickMap, matchupsById) {
  return resolveCompetitor(m, slot, pickMap, matchupsById)
}

export function buildPickMap(picks) {
  const map = {}
  for (const p of picks || []) {
    const mid = p.matchup?._id || p.matchup
    const wid = p.selectedWinner?._id || p.selectedWinner
    if (mid && wid) map[mid.toString()] = wid.toString()
  }
  return map
}

export const ROUND_TABS = [
  { key: 'opening', label: 'Opening' },
  { key: 'first_round', label: 'First round' },
  { key: 'quarterfinal', label: 'Quarterfinals' },
  { key: 'semifinal', label: 'Semifinals' },
  { key: 'championship', label: 'Championship' },
]

export function advancesToLabel(m) {
  const n = m.nextMatchup
  if (!n || !n.key) return null
  return [n.displayRound, n.key].filter(Boolean).join(' · ')
}

export function dependsOnHint(m, pickMap, matchupsById) {
  const missing = []
  const need = (feeder) => {
    if (!feeder) return
    const fid = (feeder._id || feeder).toString()
    if (!pickMap[fid]) {
      const fm = matchupsById[fid]
      missing.push(fm ? `${fm.displayRound} (${fm.key})` : fid)
    }
  }
  if (!m.team1 && m.feederForTeam1) need(m.feederForTeam1)
  if (!m.team2 && m.feederForTeam2) need(m.feederForTeam2)
  if (!missing.length) return null
  return `Finish first: ${missing.join(' · ')}`
}

export function pickProgressCount(matchups, pickMap) {
  const total = matchups.length
  let picked = 0
  for (const x of matchups) {
    if (pickMap[x._id.toString()]) picked += 1
  }
  return { picked, total }
}

export function formatScheduledAt(iso) {
  if (!iso) return null
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return null
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  } catch {
    return null
  }
}
