const VideoRepo = require('../repository/video')

/**
 * @api {GET} /videos/news Retourne les vides en construction
 */
module.exports = {

  createVideo: async (req, res, next) => {
    // let title = req.body.title
    // title = title.replace(/\w\S*/g, (w) => (w.replace(/^\w/, (c) => c.toUpperCase())));
    // let video = await VideoRepo.findByTitle(title)
    // if (video) {
    //   res.responseApi.error('une video porte déjà ce nom', 500)
    // } else {
      const video = await VideoRepo.createVideo()
      res.responseApi.success(video, 200)
    next()
  },
  loadVideo: async (req, res, next) => {
    let id = req.body.id
    if(!id) {
      id = req.params.id
    }
    let video = await VideoRepo.find(id)
    if (!video) {
      res.responseApi.error("aucune video n'a été trouvée", 404)
    } else {
      res.responseApi.success(video, 200)
    }
    next()
  },
  updateVideo: async (req, res, next) => {
    let video = await VideoRepo.find(req.params.id)
    if (!video) {
      res.responseApi.error('aucune video trouvée', 500)
    } else {
      let video = {
        ...req.body
      }
      video = await VideoRepo.update(video)
      res.responseApi.success(video, 200)
    }
    next()
  }
}
