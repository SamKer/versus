const VideoRepo = require('../repository/video')
const logger = require('../lib/logger')
const ytdl = require('ytdl-core')
const fs = require('fs')
const config = require('../lib/config')

module.exports = async (video) => {
  // on procède au download
  logger.info('Api/Download', `${video.urlOrigin} downloading: ${video.progress}`)
  if (video.progress === 0) {
    // start download
    video.vid = ytdl.getURLVideoID(video.urlOrigin)
    video.pathOrigin = `${config.video_path}/original/${video.vid}.mp4`
    ytdl.chooseFormat(['mp4'], { quality: 'highest' })
    // let infos = await ytdl.getInfo(video.urlOrigin)
    // video.likesOriginal = infos.likes

    // console.log(infos);
    ytdl(video.urlOrigin)
      .on('progress', async (l, d, t) => {
        const progress = Math.floor((d / t) * 100)
        if (progress > video.progress) {
          video.progress = progress
          await VideoRepo.update(video)
        }
      })
      .pipe(fs.createWriteStream(video.pathOrigin))
      .on('finish', async () => {
        console.log('download end finish')
        video.state = VideoRepo.STATE_VIDEO.downloaded
        await VideoRepo.update(video)
      })
  }
}
