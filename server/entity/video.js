const mongoose = require('mongoose'),
  Schema = mongoose.Schema

const SCHEMA_VIDEOS = 'videos'

// creation du schema pour neomqtt
const mqttSchema = new Schema({
  title: { type: String, default: null },
  urlOrigin: { type: String, default: null },
  urlOriginEmbeded: { type: String, default: null },
  url: { type: String, default: null },
  state: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  vid: { type: String, default: null },
  path: { type: String, default: null },
  pathOrigin: { type: String, default: null },
  dateCreated: { type: Date, default: Date.now },
  dateUpdated: { type: Date, default: Date.now },
  description: { type: String, default: null },
  viewCount: { type: Number, default: 0 },
  viewCountOrigin: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  likesOrigin: { type: Number, default: 0 },
  dislikes: { type: Number, default: 0 },
  dislikesOrigin: { type: Number, default: 0 }
}, {
  collection: SCHEMA_VIDEOS,
  strict: false
})

// Create a model using schema
const VideoEntity = mongoose.model(SCHEMA_VIDEOS, mqttSchema)

// make this model available
module.exports = VideoEntity
