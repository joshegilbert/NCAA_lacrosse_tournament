const express = require('express')
const mongoose = require('mongoose')
const League = require('../models/League')
const { authMiddleware } = require('../middleware/auth')
const { getMatchupsMergedForLeague } = require('../utils/leagueMatchupMerge')
const { setMatchupWinner, bulkSetWinners } = require('../services/manualResultsService')

const router = express.Router()

router.use(authMiddleware)

async function requireAdmin(leagueId, userId) {
  const league = await League.findById(leagueId)
  if (!league) return { error: 'League not found', league: null }
  if (league.creator.toString() !== userId.toString()) {
    return { error: 'Forbidden', league: null }
  }
  return { league }
}

router.patch('/matchups/:matchupId/winner', async (req, res) => {
  try {
    const { leagueId } = req.body
    const { teamId } = req.body
    if (!leagueId || !teamId) {
      return res.status(400).json({ error: 'leagueId and teamId required' })
    }
    const { error } = await requireAdmin(leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })

    if (!mongoose.Types.ObjectId.isValid(req.params.matchupId) || !mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ error: 'Invalid id' })
    }

    const r = await setMatchupWinner(leagueId, req.params.matchupId, teamId)
    if (r.error) return res.status(400).json(r)
    const matchups = await getMatchupsMergedForLeague(leagueId)
    return res.json({ ok: true, matchups })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/matchups/bulk-results', async (req, res) => {
  try {
    const { leagueId, results } = req.body
    if (!leagueId || !Array.isArray(results)) {
      return res.status(400).json({ error: 'leagueId and results array required' })
    }
    const { error } = await requireAdmin(leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })

    const mapped = results.map((x) => ({
      matchupId: x.matchupId,
      teamId: x.teamId,
    }))
    const r = await bulkSetWinners(leagueId, mapped)
    if (r.error) return res.status(400).json(r)
    const matchups = await getMatchupsMergedForLeague(leagueId)
    return res.json({ ok: true, matchups })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
