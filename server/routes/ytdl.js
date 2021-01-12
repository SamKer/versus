/**
 * @api {GET} /api/v1/status Retourne le statut de l'API
 * @apiName Status API
 * @apiGroup API
 * @apiVersion 1.0.0
 * @apiDescription Retourne le statut de l'API
 * @apiPermission client
 * @apiSuccessExample {json} json-Response:
 * {"project":"API MQTT","version":"1.0.0","env":"environnement","debug":true}
 */
module.exports = (req, res, next) => {
  let c = req.vs.config;

  res.responseApi.success({
    project: c.project,
    version: c.version,
    version_api: c.version_api,
    version_publisher: c.version_publisher,
    version_subscriber: c.version_subscriber,
    env: c.env,
    debug: c.debug,
  }, 200);
  next();
}
