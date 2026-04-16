const mongoose = require('mongoose')

const playerSchema = new mongoose.Schema({
  id:    { type: String, required: true },
  name:  { type: String, required: true },
  color: { type: String, default: '#00ff00' },
  side:  { type: String, enum: ['left', 'right'], default: 'left' }
}, { _id: false })

const eventSchema = new mongoose.Schema({
  id:     { type: String, required: true },
  time:   { type: Number, required: true },
  type:   { type: String, enum: ['hit', 'ko', 'block'], default: 'hit' },
  target: { type: String, required: true },
  damage: { type: Number, default: 10 }
}, { _id: false })

const cutSchema = new mongoose.Schema({
  start: { type: Number, required: true },
  end:   { type: Number, required: true }
}, { _id: false })

const projectSchema = new mongoose.Schema({
  fightId:      { type: mongoose.Schema.Types.ObjectId, ref: 'Fight', required: true, unique: true },
  players:      [playerSchema],
  events:       [eventSchema],
  cuts:         [cutSchema],
  exportStatus: { type: String, enum: ['idle', 'processing', 'done', 'error'], default: 'idle' },
  exportError:  String,
  exportPath:   String
}, { timestamps: true })

module.exports = mongoose.model('Project', projectSchema)
