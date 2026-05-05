/**
 * @param {object} m matchup with team1, team2, feeder refs populated optional
 * @param {Record<string, object>} byId matchup id string -> doc with actualWinner populated
 */
function getActualTeamsPlaying(m, byId) {
  const out = []
  const aid = (t) => {
    if (!t) return null
    if (t._id && t.name) return t._id
    return t
  }

  if (m.team1) out.push(aid(m.team1))
  else if (m.feederForTeam1) {
    const f = m.feederForTeam1._id ? m.feederForTeam1._id.toString() : m.feederForTeam1.toString()
    const fm = byId[f]
    const aw = fm?.actualWinner?._id || fm?.actualWinner
    if (aw) out.push(aw)
  }

  if (m.team2) out.push(aid(m.team2))
  else if (m.feederForTeam2) {
    const f = m.feederForTeam2._id ? m.feederForTeam2._id.toString() : m.feederForTeam2.toString()
    const fm = byId[f]
    const aw = fm?.actualWinner?._id || fm?.actualWinner
    if (aw) out.push(aw)
  }

  return out.filter((x) => x != null)
}

function isValidAdminWinnerChoice(matchup, teamId, byId) {
  const id = teamId.toString()
  const sides = getActualTeamsPlaying(matchup, byId)
  return sides.some((s) => s.toString() === id)
}

module.exports = { getActualTeamsPlaying, isValidAdminWinnerChoice }
