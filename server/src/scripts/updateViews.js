/**
 * Met à jour le nombre de vues de chaque scène depuis YouTube
 * et enregistre un snapshot historique.
 *
 * Usage :
 *   node src/scripts/updateViews.js
 *
 * En cron (docker / crontab) :
 *   0 4 * * * node /app/src/scripts/updateViews.js >> /var/log/updateViews.log 2>&1
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') })

const mongoose     = require('mongoose')
const Fight        = require('../models/Fight')
const ViewSnapshot = require('../models/ViewSnapshot')
const { getInfo }  = require('../services/ytdlp')

const DELAY_MS = 3000 // délai entre chaque appel yt-dlp (rate-limit)

const mongoUri = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@mongo:27017/${process.env.MONGODB_DBNAME}?authSource=admin`

function sleep (ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function saveSnapshot (fightId, youtubeId, views) {
  const today    = new Date(); today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  await ViewSnapshot.findOneAndUpdate(
    { fightId, recordedAt: { $gte: today, $lt: tomorrow } },
    { fightId, youtubeId, views, recordedAt: new Date() },
    { upsert: true }
  )
}

async function main () {
  await mongoose.connect(mongoUri)
  console.log('✓ MongoDB connecté')

  const fights = await Fight.find({ youtubeUrl: { $exists: true } }).sort({ createdAt: -1 })
  console.log(`→ ${fights.length} scènes à traiter\n`)

  let ok = 0, errors = 0

  for (const fight of fights) {
    try {
      const info = await getInfo(fight.youtubeUrl)
      const views = info.views ?? 0

      // Mise à jour si les vues ont changé
      if (views !== fight.views) {
        await Fight.findByIdAndUpdate(fight._id, { views })
        console.log(`  ✓ ${fight.title || fight.movieTitle}: ${fight.views ?? '?'} → ${views} vues`)
      } else {
        console.log(`  · ${fight.title || fight.movieTitle}: ${views} vues (inchangé)`)
      }

      await saveSnapshot(fight._id, fight.youtubeId, views)
      ok++
    } catch (err) {
      console.error(`  ✗ ${fight.title || fight.movieTitle}: ${err.message}`)
      errors++
    }

    await sleep(DELAY_MS)
  }

  console.log(`\n✓ Terminé — ${ok} OK, ${errors} erreurs`)
  await mongoose.disconnect()
}

main().catch(err => {
  console.error('Erreur fatale:', err)
  process.exit(1)
})
