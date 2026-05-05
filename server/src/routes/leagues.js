const express = require('express')
const League = require('../models/League')
const BracketEntry = require('../models/BracketEntry')
const { authMiddleware } = require('../middleware/auth')
const { getDefaultLockTime } = require('../config/bracket-defaults')
const { generateInviteCode } = require('../utils/inviteCode')
const { isLeagueLocked } = require('../utils/leagueLock')
const { scoreEntry } = require('../utils/scoring')
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

async function requireAdmin(leagueId, userId) {
  const league = await League.findById(leagueId)
  if (!league) return { error: 'League not found', league: null }
  if (league.creator.toString() !== userId.toString()) {
    return { error: 'Forbidden', league: null }
  }
  return { league }
}

router.post('/', async (req, res) => {
  try {
    const { name, lockTime } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'League name required' })
    }
    const lt = lockTime ? new Date(lockTime) : await getDefaultLockTime()
    const league = await League.create({
      name: name.trim(),
      inviteCode: generateInviteCode(),
      creator: req.userId,
      members: [req.userId],
      lockTime: lt,
      isLocked: false,
      manualUnlockUntil: null,
    })
    const populated = await League.findById(league._id)
      .populate('creator', 'name email')
      .populate('members', 'name email')
    return res.status(201).json({ league: populated })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get('/', async (req, res) => {
  try {
    const leagues = await League.find({ members: req.userId })
      .populate('creator', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 })
    return res.json({ leagues })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.post('/join', async (req, res) => {
  try {
    const { inviteCode } = req.body
    if (!inviteCode || !String(inviteCode).trim()) {
      return res.status(400).json({ error: 'Invite code required' })
    }
    const code = String(inviteCode).trim().toUpperCase()
    const league = await League.findOne({ inviteCode: code })
    if (!league) return res.status(404).json({ error: 'League not found' })
    if (isLeagueLocked(league)) {
      return res.status(400).json({ error: 'League is locked' })
    }
    const uid = req.userId.toString()
    if (league.members.some((m) => m.toString() === uid)) {
      const populated = await League.findById(league._id)
        .populate('creator', 'name email')
        .populate('members', 'name email')
      return res.json({ league: populated, alreadyMember: true })
    }
    league.members.push(req.userId)
    await league.save()
    const populated = await League.findById(league._id)
      .populate('creator', 'name email')
      .populate('members', 'name email')
    return res.json({ league: populated })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:leagueId/leaderboard', async (req, res) => {
  try {
    const { league, error } = await requireMember(req.params.leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })

    const matchups = await getMatchupsMergedForLeague(league._id)
    const entries = await BracketEntry.find({ league: league._id }).populate([
      { path: 'user', select: 'name email' },
      { path: 'picks.matchup' },
      { path: 'picks.selectedWinner' },
    ])

    const entryByUser = {}
    for (const en of entries) {
      entryByUser[en.user._id.toString()] = en
    }

    const fullLeague = await League.findById(league._id).populate('members', 'name email')
    const rows = []
    for (const member of fullLeague.members) {
      const entry = entryByUser[member._id.toString()]
      const picks = entry ? entry.picks : []
      const s = scoreEntry(matchups, picks)
      let championName = null
      if (entry) {
        const championPick = entry.picks.find((p) => p.matchup?.roundKey === 'championship')
        if (championPick && championPick.selectedWinner) {
          championName = championPick.selectedWinner.name || null
        }
      }
      const displayName = (entry && entry.bracketDisplayName) || member.name
      rows.push({
        userId: member._id,
        name: displayName,
        accountName: member.name,
        totalPoints: s.totalPoints,
        correctPicks: s.correct,
        incorrectPicks: s.incorrect,
        pendingPicks: s.pending,
        incompletePicks: s.incomplete,
        championPick: championName,
      })
    }

    rows.sort((a, b) => b.totalPoints - a.totalPoints)
    const ranked = rows.map((r, i) => ({ rank: i + 1, ...r }))

    return res.json({ leaderboard: ranked, locked: isLeagueLocked(league) })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.get('/:leagueId', async (req, res) => {
  try {
    const { league, error } = await requireMember(req.params.leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })
    const populated = await League.findById(league._id)
      .populate('creator', 'name email')
      .populate('members', 'name email')
    return res.json({
      league: populated,
      locked: isLeagueLocked(populated),
    })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

router.patch('/:leagueId/lock', async (req, res) => {
  try {
    const { league, error } = await requireAdmin(req.params.leagueId, req.userId)
    if (error) return res.status(error === 'Forbidden' ? 403 : 404).json({ error })
    const { isLocked } = req.body
    if (typeof isLocked !== 'boolean') {
      return res.status(400).json({ error: 'isLocked boolean required' })
    }
    league.isLocked = isLocked
    if (isLocked) {
      league.manualUnlockUntil = null
    } else {
      // Creator override: allow opening even after lockTime for testing/corrections.
      league.manualUnlockUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
    await league.save()
    const populated = await League.findById(league._id)
      .populate('creator', 'name email')
      .populate('members', 'name email')
    return res.json({ league: populated })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Server error' })
  }
})

module.exports = router
