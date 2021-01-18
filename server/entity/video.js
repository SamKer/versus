const mongoose = require('mongoose'),
  Schema = mongoose.Schema

const SCHEMA_VIDEOS = 'videos'

// creation du schema pour neomqtt
const mqttSchema = new Schema({
  title: String,
  urlOrigin: {type: String, default: null },
  url: {type: String, default: null },
  state: { type: Number, default: 0 },
  progress: { type: Number, default: 0 },
  vid: {type: String, default: null },
  path: {type: String, default: null},
  pathOrigin: {type: String, default: null}
}, {
  collection: SCHEMA_VIDEOS,
  strict: false
})

// Create a model using schema
const VideoEntity = mongoose.model(SCHEMA_VIDEOS, mqttSchema)

// make this model available
module.exports = VideoEntity
