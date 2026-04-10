const { execFile } = require('child_process')
const path = require('path')

const dataPath = process.env.DATA_PATH || path.join(__dirname, '../../../data')

function getInfo (url) {
  return new Promise((resolve, reject) => {
    execFile('yt-dlp', ['--dump-json', '--no-playlist', url], (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message))
      try {
        const info = JSON.parse(stdout)
        resolve({
          youtubeId:   info.id,
          title:       info.title,
          views:       info.view_count,
          description: info.description,
          thumbnail:   info.thumbnail,
          uploadDate:  info.upload_date,
          duration:    info.duration,
          channel:     info.channel
        })
      } catch (e) {
        reject(new Error('Failed to parse yt-dlp output'))
      }
    })
  })
}

function downloadVideo (url, youtubeId) {
  return new Promise((resolve, reject) => {
    const filename = `${youtubeId || Date.now()}.mp4`
    const outputPath = path.join(dataPath, 'videos', filename)
    execFile(
      'yt-dlp',
      ['-o', outputPath, '--no-playlist', '--merge-output-format', 'mp4', url],
      { timeout: 600000 },
      (err, stdout, stderr) => {
        if (err) return reject(new Error(stderr || err.message))
        resolve(`/media/videos/${filename}`)
      }
    )
  })
}

module.exports = { getInfo, downloadVideo }
