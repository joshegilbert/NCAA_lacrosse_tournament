const mongoose = require('mongoose')

const teamSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    seed: { type: Number },
    logoUrl: { type: String },
    record: { type: String },
    conference: { type: String },
    recordAsOf: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
)

module.exports = mongoose.model('Team', teamSchema)
