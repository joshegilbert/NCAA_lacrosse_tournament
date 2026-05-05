const mongoose = require('mongoose')

const leagueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    inviteCode: { type: String, required: true, unique: true, uppercase: true },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    lockTime: { type: Date, required: true },
    isLocked: { type: Boolean, default: false },
    manualUnlockUntil: { type: Date, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

module.exports = mongoose.model('League', leagueSchema)
