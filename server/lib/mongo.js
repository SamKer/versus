require('saslprep')
const mongoose = require('mongoose')
mongoose.Promise = require('bluebird')
const logger = require('./logger')
const config = require('./config')

console.log(config)
// allow lock collection
// mongoose.plugin(require('mongoose-schema-lock'), {promise: true});
// mongoose.Promise = Promise;

/**
 * Fonction qui permet d'établir une connexion avec la base de données mongoDB
 * @param callback
 */
const Mongo = {

  _debug: true,
  _events: ['connecting', 'connected', 'open', 'disconnecting', 'disconnected', 'close', 'reconnected', 'error', 'fullsetup', 'all', 'reconnectFailed', 'reconnectTries'],

  _connexion: null,

  connect: async () => {
    try {
      if (!Mongo._connexion) {
        if (Mongo._debug) {
          Mongo._events.forEach(e => {
            mongoose.connection.on(e, () => {
              logger.info('Mongo:Event', e)
            })
          })
        }

        const url = `mongodb://${config.mongo.user}:${config.mongo.pwd}@${config.mongo.url}:${config.mongo.port}/${config.mongo.name}`
        try {
          await mongoose.connect(url, config.mongo.options)
          Mongo._connexion = true
        } catch (e) {
          logger.error('Mongo:Error', e)
          return null
        }
      }
    } catch (e) {
      logger.info('Mongo:Error', e)
    }
  },

  disconnect: async () => {
    if (Mongo._connexion) {
      await mongoose.connection.close()
      Mongo._connexion = null
    }
  }
}
module.exports = Mongo
