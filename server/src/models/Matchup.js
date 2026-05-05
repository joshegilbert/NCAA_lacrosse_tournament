const mongoose = require('mongoose')

const matchupSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    season: { type: Number, default: 2026 },
    roundKey: {
      type: String,
      required: true,
      enum: ['opening', 'first_round', 'quarterfinal', 'semifinal', 'championship'],
    },
    displayRound: { type: String, required: true },
    scoringTier: {
      type: String,
      required: true,
      enum: ['firstRound', 'quarterfinal', 'semifinal', 'championship'],
    },
    roundOrder: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    team1: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    team2: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    feederForTeam1: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Matchup',
      default: null,
    },
    feederForTeam2: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Matchup',
      default: null,
    },
    nextMatchup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Matchup',
      default: null,
    },
    /** 0 = advances as team1 in next, 1 = advances as team2 */
    nextSlot: { type: Number, default: null },
    actualWinner: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    scheduledAt: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

module.exports = mongoose.model('Matchup', matchupSchema)
