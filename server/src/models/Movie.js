const mongoose = require('mongoose')

const movieSchema = new mongoose.Schema({
  tmdbId:        { type: Number, unique: true, sparse: true },
  title:         { type: String, required: true },
  originalTitle: String,
  year:          Number,
  poster:        String,
  synopsis:      String,
  genres:        [String],
  director:      String,
  choreographer: String
}, {
  timestamps: true,
  collection: 'movies'
})

module.exports = mongoose.model('Movie', movieSchema)
