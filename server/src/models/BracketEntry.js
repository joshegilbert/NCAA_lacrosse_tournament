const mongoose = require('mongoose')

const pickSchema = new mongoose.Schema(
  {
    matchup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Matchup',
      required: true,
    },
    selectedWinner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    roundKey: { type: String, required: true },
  },
  { _id: false }
)

const bracketEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    league: { type: mongoose.Schema.Types.ObjectId, ref: 'League', required: true },
    picks: [pickSchema],
    /** Optional pool / bracket nickname shown on leaderboard (max 40 chars). */
    bracketDisplayName: { type: String, default: null, maxlength: 40, trim: true },
    submittedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: false }
)

bracketEntrySchema.index({ league: 1, user: 1 }, { unique: true })

module.exports = mongoose.model('BracketEntry', bracketEntrySchema)
