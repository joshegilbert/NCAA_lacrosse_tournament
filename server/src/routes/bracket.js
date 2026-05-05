const express = require('express')
const mongoose = require('mongoose')
const League = require('../models/League')
const BracketEntry = require('../models/BracketEntry')
const { authMiddleware } = require('../middleware/auth')
const { isLeagueLocked } = require('../utils/leagueLock')
const { validatePicksAgainstMatchups } = require('../utils/picks')
const { breakdownPicks } = require('../utils/scoring')
const { getMatchupsMergedForLeague } = require('../utils/leagueMatchupMerge')

const router = express.Router()

router.use(authMiddleware)

async function requireMember(leagueId, userId) {
  const league = await League.findById(leagueId)
  if (!league) return { error: 'League not found', league: null }
  const ok = league.members.some((m) => m.toString() === userId.toString())
  if (!ok) return { error: 'Forbidden', league: null }
  return { league }
}

router.get('/league/:leagueId/matchups', async (req, res) => {
  try {
    const { error } = await requireMember(req.params.leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })
    const matchups = await getMatchupsMergedForLeague(req.params.leagueId)
    return res.json({ matchups })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get('/league/:leagueId/my-entry', async (req, res) => {
  try {
    const { league, error } = await requireMember(req.params.leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })

    const matchups = await getMatchupsMergedForLeague(league._id)
    const entry = await BracketEntry.findOne({
      league: league._id,
      user: req.userId,
    }).populate([{ path: 'picks.matchup' }, { path: 'picks.selectedWinner' }])

    const locked = isLeagueLocked(league)
    if (!entry) {
      const breakdown = breakdownPicks(matchups, [])
      return res.json({
        entry: null,
        hasEntry: false,
        locked,
        breakdown,
      })
    }
    const breakdown = breakdownPicks(matchups, entry.picks)
    return res.json({ entry, hasEntry: true, locked, breakdown })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.post('/league/:leagueId/entry', async (req, res) => {
  try {
    const { league, error } = await requireMember(req.params.leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })

    if (isLeagueLocked(league)) {
      return res.status(400).json({ error: 'Bracket is locked' })
    }

    const { picks: incoming = [] } = req.body
    if (!Array.isArray(incoming)) {
      return res.status(400).json({ error: 'picks must be an array' })
    }

    let bracketDisplayNameUpdate
    if ('bracketDisplayName' in req.body) {
      const s = String(req.body.bracketDisplayName ?? '').trim()
      if (s.length > 40) {
        return res.status(400).json({ error: 'bracketDisplayName max 40 characters' })
      }
      bracketDisplayNameUpdate = s || null
    }

    const matchups = await getMatchupsMergedForLeague(league._id)

    const existing = await BracketEntry.findOne({
      league: league._id,
      user: req.userId,
    })
    const combinedPickMap = {}
    if (existing) {
      for (const p of existing.picks) {
        const mid = p.matchup.toString()
        combinedPickMap[mid] = p.selectedWinner.toString()
      }
    }
    for (const p of incoming) {
      if (p.matchupId && p.selectedWinnerId) {
        combinedPickMap[p.matchupId.toString()] = p.selectedWinnerId.toString()
      }
    }
    const asRows = Object.keys(combinedPickMap).map((matchupId) => ({
      matchupId,
      selectedWinnerId: combinedPickMap[matchupId],
    }))

    const vErr = validatePicksAgainstMatchups(matchups, asRows)
    if (vErr.length) {
      return res.status(400).json({ error: 'Invalid picks', details: vErr })
    }

    const pickDocs = asRows.map((p) => {
      const m = matchups.find((x) => x._id.toString() === p.matchupId.toString())
      return {
        matchup: new mongoose.Types.ObjectId(p.matchupId),
        selectedWinner: new mongoose.Types.ObjectId(p.selectedWinnerId),
        roundKey: m.roundKey,
      }
    })

    const setDoc = {
      picks: pickDocs,
      updatedAt: new Date(),
    }
    if (bracketDisplayNameUpdate !== undefined) {
      setDoc.bracketDisplayName = bracketDisplayNameUpdate
    }

    const entry = await BracketEntry.findOneAndUpdate(
      { league: league._id, user: req.userId },
      {
        $set: setDoc,
        $setOnInsert: { user: req.userId, league: league._id, submittedAt: new Date() },
      },
      { new: true, upsert: true, runValidators: true }
    ).populate([{ path: 'picks.matchup' }, { path: 'picks.selectedWinner' }])

    const breakdown = breakdownPicks(matchups, entry.picks)
    return res.json({
      entry,
      hasEntry: true,
      locked: isLeagueLocked(league),
      breakdown,
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get('/league/:leagueId/entries', async (req, res) => {
  try {
    const { league, error } = await requireMember(req.params.leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })

    const list = await BracketEntry.find({ league: league._id })
      .populate('user', 'name email')
      .select('user updatedAt bracketDisplayName')
    return res.json({
      entries: list.map((e) => ({
        userId: e.user._id,
        name: e.bracketDisplayName || e.user.name,
        accountName: e.user.name,
        email: e.user.email,
        updatedAt: e.updatedAt,
      })),
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get('/league/:leagueId/entries/:userId', async (req, res) => {
  try {
    const { league, error } = await requireMember(req.params.leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })

    const targetId = req.params.userId
    if (!league.members.some((m) => m.toString() === targetId)) {
      return res.status(404).json({ error: 'User is not in this league' })
    }

    const matchups = await getMatchupsMergedForLeague(league._id)
    const entry = await BracketEntry.findOne({
      league: league._id,
      user: targetId,
    }).populate([{ path: 'picks.matchup' }, { path: 'picks.selectedWinner' }])

    const locked = isLeagueLocked(league)
    if (!entry) {
      const breakdown = breakdownPicks(matchups, [])
      return res.json({ entry: null, hasEntry: false, userId: targetId, locked, breakdown })
    }
    const breakdown = breakdownPicks(matchups, entry.picks)
    return res.json({ entry, hasEntry: true, userId: targetId, locked, breakdown })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
