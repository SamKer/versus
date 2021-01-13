const UserRepo = require('./../repository/user')
const logger = require('./logger')

/**
 *
 * @type {{authentify: Auth.authentify, certIdent: Auth.certIdent, basicIdent: (function(*): {password: string, login: string, type: string}), basicAuth: (function(*=, *=): *|boolean), certAuth: (function(*=, *): *|boolean), user: null, backends: [string, string]}}
 */
const Auth = {

  user: null,

  /**
     * Backend auth
     */
  backends: ['cert', 'basic'],

  authentify: async (req) => {
    // if(!Auth.user) {
    // identification
    var identity = { login: null, password: null, type: null }
    // dès qu'un backend a identifié, on skip les autres
    for (let i = 0; i < Auth.backends.length; i++) {
      // identification
      const b = Auth.backends[i]
      identity = Auth[b + 'Ident'](req)
      if (identity && identity.login !== null) {
        break
      }
    }
    // si rien identifié, alors error
    if (!identity || identity.login === null) {
      logger.info('Auth:Ident', 'User expected, null given')
      return null
    }

    const user = await UserRepo.find(identity.login, identity.type)
    if (user) {
      logger.info('Auth:base', 'user found: ' + identity.login)
      Auth[identity.type + 'Auth'](identity, user)

      logger.info('Auth:' + identity.type + ']', 'user authentified: ' + identity.login)
      Auth.user = user
      return user
    } else {
      logger.info('Auth:base', 'User not found: ' + identity.login)
      return null
    }

    // } else {
    //     logger.info('Auth:', 'user already identified: ' + Auth.user.login);
    //     return Auth.user;
    // }
  },

  basicIdent: (req) => {
    const [login, password] = Buffer.from((req.headers.authorization || '').split(' ')[1] || '', 'base64').toString().split(':')
    return { login: login, password: password, type: 'basic' }
  },

  basicAuth: (identity, user) => {
    return (identity && user && identity.password === user.password)
  },

  certIdent: (req) => {
    if (!req.client.authorized) {
      logger.info('Auth:Cert', 'cert no authorized')
    } else {
      logger.info('Auth:Cert', 'cert authorized')
      var cert = req.socket.getPeerCertificate()
      if (cert.subject && cert.subject.CN) {
        return { login: cert.subject.CN, password: null, type: 'cert' }
      }
    }
    return null
  },

  /**
     * Authentifie
     * ici le certificat est déjà authentifié, on verifie juste qu'on a bien un login
     * @param identity
     * @param user
     * @returns {boolean}
     */
  certAuth: (identity, user) => {
    return (identity && identity.login !== null && ('login' in identity))
  }

}

module.exports = Auth
