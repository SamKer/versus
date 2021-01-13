/**
 * /api/v1/ping Test de fonctionnement
 * PONG
 */
module.exports = (req, res, next) => {
    res.responseApi.success("pong", 200);
    next();
};
