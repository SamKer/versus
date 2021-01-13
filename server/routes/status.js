/**
 * /status Retourne le statut de l'API
 */
module.exports = (req, res, next) => {
  const c = req.vs.config
  res.responseApi.success({
    project: c.project,
    version: c.version,
    env: c.env,
    debug: c.debug
  }, 200)
  next()
}
