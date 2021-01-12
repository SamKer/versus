module.exports = (req, res, next) => {
    req.vs.logger.reqId = req.vs.uuid.v1().split('-')[4];
    req.reqId = req.vs.uuid.v1().split('-')[4];
    next();
}
