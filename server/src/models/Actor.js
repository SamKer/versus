const mongoose = require('mongoose')

const actorSchema = new mongoose.Schema({
  tmdbId:       { type: Number, unique: true, sparse: true },
  name:         { type: String, required: true },
  photo:        String,
  birthDate:    Date,
  placeOfBirth: String,
  biography:    String
}, {
  timestamps: true,
  collection: 'actors'
})

module.exports = mongoose.model('Actor', actorSchema)
