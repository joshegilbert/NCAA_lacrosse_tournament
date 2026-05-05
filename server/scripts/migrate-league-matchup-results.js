/**
 * One-time: copy global Matchup.actualWinner into LeagueMatchupResult for every league.
 * Run: cd server && node scripts/migrate-league-matchup-results.js
 */
require('dotenv').config()
const mongoose = require('mongoose')
const { mongoUri } = require('../src/config/app.config')
require('../src/models/register')
const League = require('../src/models/League')
const Matchup = require('../src/models/Matchup')
const LeagueMatchupResult = require('../src/models/LeagueMatchupResult')

async function main() {
  await mongoose.connect(mongoUri)
  const leagues = await League.find({}).select('_id')
  const withWinner = await Matchup.find({ actualWinner: { $ne: null } }).select('_id actualWinner')

  let inserted = 0
  for (const league of leagues) {
    for (const m of withWinner) {
      await LeagueMatchupResult.updateOne(
        { league: league._id, matchup: m._id },
        { $set: { league: league._id, matchup: m._id, actualWinner: m.actualWinner } },
        { upsert: true }
      )
      inserted += 1
    }
  }
  console.log(`Upserted ${inserted} league/matchup rows across ${leagues.length} leagues`)
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
