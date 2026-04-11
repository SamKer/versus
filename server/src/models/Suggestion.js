const mongoose = require('mongoose')

const suggestionSchema = new mongoose.Schema({
  name:       String,
  youtubeUrl: String,
  message:    { type: String, required: true },
  read:       { type: Boolean, default: false }
}, {
  timestamps: true,
  collection: 'suggestions'
})

module.exports = mongoose.model('Suggestion', suggestionSchema)
