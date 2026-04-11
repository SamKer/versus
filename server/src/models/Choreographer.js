const mongoose = require('mongoose')

const choreographerSchema = new mongoose.Schema({
  name:   { type: String, required: true, unique: true },
  tmdbId: { type: Number, unique: true, sparse: true },
  photo:  String
}, {
  timestamps: true,
  collection: 'choreographers'
})

module.exports = mongoose.model('Choreographer', choreographerSchema)
