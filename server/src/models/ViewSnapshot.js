const mongoose = require('mongoose')

const viewSnapshotSchema = new mongoose.Schema({
  fightId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Fight', required: true, index: true },
  youtubeId: String,
  views:     { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now }
}, {
  timestamps: false,
  collection: 'view_snapshots'
})

// Index pour éviter les doublons par jour (upsert dans saveViewSnapshot)
viewSnapshotSchema.index({ fightId: 1, recordedAt: 1 })

module.exports = mongoose.model('ViewSnapshot', viewSnapshotSchema)
