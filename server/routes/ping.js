/**
 * @api {GET} /api/v1/ping Test de fonctionnement
 * @apiName Test API
 * @apiGroup API
 * @apiVersion 1.0.0
 * @apiDescription Test de l'application
 * @apiPermission client
 * @apiSuccessExample {html} html-Response:
 * PONG
 */
module.exports = (req, res, next) => {
    res.responseApi.success("pong", 200);
    next();
};