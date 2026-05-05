/* eslint-disable no-console */
require('dotenv').config()
const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')
const { mongoUri } = require('../src/config/app.config')
const Team = require('../src/models/Team')
const Matchup = require('../src/models/Matchup')

const dataDir = path.join(__dirname, '../data')
const teamsJson = JSON.parse(fs.readFileSync(path.join(dataDir, 'teams-2026.json'), 'utf8'))
const bracketJson = JSON.parse(
  fs.readFileSync(path.join(dataDir, 'bracket-2026.di.json'), 'utf8')
)

async function run() {
  await mongoose.connect(mongoUri)
  console.log('Connected to MongoDB')

  await Team.deleteMany({})
  await Matchup.deleteMany({ season: bracketJson.season })

  const slugToTeamId = {}
  for (const t of teamsJson) {
    const created = await Team.create({
      slug: t.slug,
      name: t.name,
      seed: t.seed,
      record: t.record,
      conference: t.conference,
      logoUrl: t.logoUrl,
      recordAsOf: t.recordAsOf,
    })
    slugToTeamId[t.slug] = created._id
  }
  console.log(`Seeded ${teamsJson.length} teams`)

  const keyToId = {}
  const rows = bracketJson.matchups

  for (const row of rows) {
    const doc = {
      key: row.key,
      season: bracketJson.season,
      roundKey: row.roundKey,
      displayRound: row.displayRound,
      scoringTier: row.scoringTier,
      roundOrder: row.roundOrder,
      position: row.position,
      team1: row.team1Slug ? slugToTeamId[row.team1Slug] : null,
      team2: row.team2Slug ? slugToTeamId[row.team2Slug] : null,
      feederForTeam1: null,
      feederForTeam2: null,
      nextMatchup: null,
      nextSlot: row.nextSlot != null ? row.nextSlot : null,
      scheduledAt: row.scheduledAt ? new Date(row.scheduledAt) : null,
    }
    const m = await Matchup.create(doc)
    keyToId[row.key] = m._id
  }

  for (const row of rows) {
    const updates = {}
    if (row.nextKey) updates.nextMatchup = keyToId[row.nextKey]
    if (row.nextSlot != null) updates.nextSlot = row.nextSlot
    if (row.feeder1Key) updates.feederForTeam1 = keyToId[row.feeder1Key]
    if (row.feeder2Key) updates.feederForTeam2 = keyToId[row.feeder2Key]
    if (Object.keys(updates).length) {
      await Matchup.updateOne({ _id: keyToId[row.key] }, { $set: updates })
    }
  }

  const count = await Matchup.countDocuments({ season: bracketJson.season })
  console.log(`Seeded ${count} matchups for season ${bracketJson.season}`)
  await mongoose.disconnect()
  console.log('Done.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
