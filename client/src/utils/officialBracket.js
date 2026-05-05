/**
 * Tournament-truth sides from admin-entered actual winners (recursive).
 */
export function resolveOfficialSide(m, slot, byId) {
  if (slot === 1) {
    if (m.team1) return m.team1
    if (m.feederForTeam1) {
      const fid = (m.feederForTeam1._id || m.feederForTeam1).toString()
      const fm = byId[fid]
      return fm?.actualWinner || null
    }
    return null
  }
  if (m.team2) return m.team2
  if (m.feederForTeam2) {
    const fid = (m.feederForTeam2._id || m.feederForTeam2).toString()
    const fm = byId[fid]
    return fm?.actualWinner || null
  }
  return null
}

export function teamIdStr(t) {
  if (!t) return ''
  return (t._id || t).toString()
}
