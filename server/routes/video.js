const VideoRepo = require('../repository/video')

/**
 * @api {GET} /videos/news Retourne les vides en construction
 */
module.exports = async (req, res, next) => {
  let title = req.body.title
  let video = await VideoRepo.createVideo(title)
  res.responseApi.success(video, 200)
  next()
}
