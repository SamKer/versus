const Auth = require('../lib/auth')
module.exports = async (req, res, next) => {
  req.vs.logger.info('Auth:', 'authentify')
  const user = await Auth.authentify(req)
  if (!user) {
    res.setHeader('WWW-Authenticate', 'Basic realm="88mph Authentification"')
    res.responseApi.error('Unauthorized: Access is denied, no user authentified', 401)
    res.responseApi.send()
    return
  }
  req.user = user
  next()
}
