const VideoRepo = require('../repository/video')
const download = require('../middlewares/download')

/**
 * @api {GET} /ytdl Retourne le statut de l'API
 */
module.exports = async (req, res, next) => {
  let video = null
  if(req.body._id) {
    video = await VideoRepo.find(req.body._id)
  } else {
    video = await VideoRepo.findByOrigin(req.body.urlOrigin)
  }
  if (!video) {
    video = {urlOrigin: req.body.urlOrigin}
    video = await VideoRepo.add(req.body.urlOrigin)
  } else {
    video.urlOrigin = req.body.urlOrigin
    video = await VideoRepo.update(video)
  }
  let force = null
  if(req.body.forceDownload) {
    force = true
  }

  res.responseApi.success(video, 200)
  res.on('finish', () => {download(video, force)})
  //res.on('close', () => () => {download(video)})
  next()
}
