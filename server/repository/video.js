const Entity = require('../entity/video')
const STATE_VIDEO = {
  created: 0,
  downloaded: 1
}


const VideoRepo = {

  /**
     * Cherche une video
     * @param url
     * @returns {Promise<*>}
     */
  findByOrigin: async (url) => {
    return await Entity.findOne({ urlOrigin: url }).exec()
  },
  find: async (url) => {
    return await Entity.findOne({ url: url }).exec()
  },

  /**
     * créer une nouvelle vidéo
     * @param {String} url origin
     * @returns {Promise<void>}
     */
  add: async (url) => {
    const e = new Entity({
      urlOrigin: url,
      state: STATE_VIDEO.created,
      progress: 0
    })
    return await Entity.create(e.toObject())
  }

}

module.exports = VideoRepo
