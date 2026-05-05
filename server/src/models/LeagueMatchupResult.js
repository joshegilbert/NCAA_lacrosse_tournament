const mongoose = require('mongoose')

const leagueMatchupResultSchema = new mongoose.Schema(
  {
    league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
    matchup: { type: mongoose.Schema.Types.ObjectId, ref: 'Matchup', required: true },
    actualWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  },
  { timestamps: true }
)

leagueMatchupResultSchema.index({ league: 1, matchup: 1 }, { unique: true })

module.exports = mongoose.model('LeagueMatchupResult', leagueMatchupResultSchema)
