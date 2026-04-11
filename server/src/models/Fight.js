const mongoose = require('mongoose')

const actorSchema = new mongoose.Schema({
  name: String,
  character: String,
  photo: String,
  tmdbId: Number
}, { _id: false })

const fightSchema = new mongoose.Schema({
  youtubeUrl:   { type: String, required: true },
  youtubeId:    String,
  youtubeTitle: String,
  views:        Number,
  thumbnail:    String,
  movieTitle:   { type: String, required: true },
  movieYear:    Number,
  movieTmdbId:  Number,
  moviePoster:  String,
  title:         String,
  choreographer: String,
  actors:       [actorSchema],
  videoPath:    String
}, { timestamps: true })

module.exports = mongoose.model('Fight', fightSchema)
