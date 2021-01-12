require('dotenv').config()
const path = require('path')
const c = process.env

// le root path peut préter à confusion à cause du lien symbolic sur le répertoire
// et cause des abérrations avec pm2
if (!c.ROOT_PATH) {
  c.ROOT_PATH = path.resolve(__dirname, '../../')
}
if (!c.DATA_DIR) {
  c.DATA_DIR = `${c.ROOT_PATH}/var`
}

module.exports = {
  project: require(`${c.ROOT_PATH}/package`).name,
  root_path: c.ROOT_PATH,
  web_path: `${c.ROOT_PATH}/web`,
  var_path: c.DATA_DIR,
  cache_path: `${c.DATA_DIR}/cache`,
  log_path: `${c.DATA_DIR}/log`,
  version: require(`${c.ROOT_PATH}/package`).version,
  debug: c.DEBUG === 'true',
  verbosity: 0,
  env: c.NODE_ENV,
  server: {
    url: c.SERVER_URL,
    port: c.SERVER_PORT
  },
  mongo: {
    url: c.MONGODB_HOST,
    port: c.MONGODB_PORT,
    name: c.MONGODB_DBNAME,
    user: c.MONGODB_USER,
    pwd: c.MONGODB_PASSWORD,
    options: {
      auto_reconnect: true,
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
      bufferMaxEntries: 0,
      connectTimeoutMS: 1000,
      keepAlive: true,
      poolSize: 10
    }
  },
  mailer: {
    from: c.MAILER_FROM,
    admin: c.MAILER_ADMIN,
    transporter: {
      host: c.MAILER_HOST,
      port: c.MAILER_PORT,
      secure: c.MAILER_SSL | false,
      tls: { rejectUnauthorized: false },
      auth: {
        user: c.MAILER_AUTH_USER,
        pass: c.MAILER_AUTH_PASS
      }
    }
  }
}
