const VideoRepo = require('../repository/video')

/**
 * @api {GET} /videos/news Retourne les vides en construction
 */
module.exports = async (req, res, next) => {
  const videos = await VideoRepo.fetchAll()
  res.responseApi.success(videos, 200)
  next()
}
