/**
 * Teams playing in this matchup for admin entry (from fixed seeds + prior actual winners).
 * Returns full team documents for labels.
 */
export function actualTeamsPlaying(m, byId) {
  const out = []
  if (m.team1) out.push(m.team1)
  else if (m.feederForTeam1) {
    const fid = (m.feederForTeam1._id || m.feederForTeam1).toString()
    const fm = byId[fid]
    const aw = fm?.actualWinner
    if (aw) out.push(aw)
  }
  if (m.team2) out.push(m.team2)
  else if (m.feederForTeam2) {
    const fid = (m.feederForTeam2._id || m.feederForTeam2).toString()
    const fm = byId[fid]
    const aw = fm?.actualWinner
    if (aw) out.push(aw)
  }
  return out.filter(Boolean)
}
