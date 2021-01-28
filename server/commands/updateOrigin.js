const VideoRepo = require('../repository/video')
const ytdl = require('ytdl-core')

module.exports = {
  name: 'upOrigin',
  shortcut: ['--update-origin'],
  usage: 'node console --update-origin',
  shortdesc: 'Met à jour les infos d\'origin',
  fulldesc: 'met à jour les infos likes,dislikes et viewcount',
  prod: true,

  /**
     * Execute la command
     * @param options
     * @param arguments
     * @param io inputoutput console
     * @param mph Global Instance of 88mph
     */
  async execute (options, arguments, io, vs) {
    io.writeln('<fg=yellow>MAJ Infos Origin: </>')
    const videos = await VideoRepo.fetchAll()
    for (const video of videos) {
      if (video.urlOrigin) {
        io.writeln(`\t<fg=green>${video.title}</>\tupdating...\t\t</>`)
        const infos = await ytdl.getInfo(video.urlOrigin)
        // ajout meta data
        video.urlOriginEmbeded = infos.videoDetails.embed.iframeUrl
        video.viewCountOrigin = infos.videoDetails.viewCount
        video.likesOrigin = infos.videoDetails.likes
        video.dislikesOrigin = infos.videoDetails.dislikes
        await VideoRepo.update(video)
      } else {
        io.writeln(`\t<fg=green>${video.title}</>\tskip (no url)...s\t\t</>`)
      }
    }
  }
}
