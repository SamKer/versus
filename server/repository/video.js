const Entity = require('../entity/video')

const VideoRepo = {

  STATE_VIDEO: {
    created: 0,
    downloaded: 1,
    completed: 2
  },
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
      state: VideoRepo.STATE_VIDEO.created,
      progress: 0
    })
    return await Entity.create(e.toObject())
  },

  update: async (video) => {
    return await Entity.findOneAndUpdate(
      {urlOrigin: video.urlOrigin},
      video
    )
  },

  fetchVideosNews: async () => {
    return await Entity.aggregate([{
        $match: {
          state: {
            $ne: VideoRepo.STATE_VIDEO.completed
          }
        }
      }]
    )
  },

}

module.exports = VideoRepo
