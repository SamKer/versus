const VideoRepo = require('../repository/video')
const download = require('../middlewares/download')

/**
 * @api {GET} /ytdl Retourne le statut de l'API
 */
module.exports = async (req, res, next) => {
  let video = await VideoRepo.findByOrigin(req.body.url);
  if (!video) {
    video = await VideoRepo.add(req.body.url)
  }

  res.responseApi.success(video, 200)
  req.video = video
  res.on('finish', () => {download(video)})
  //res.on('close', () => () => {download(video)})
  next()
}
