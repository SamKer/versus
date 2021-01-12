const Response = require('../lib/response')
module.exports.prepend = (req, res, next) => {
  // on prepare une reponse json
  res.responseApi = new Response(req, res)
  next()
}
module.exports.append = (req, res, next) => {
  if ('responseApi' in res && res.responseApi instanceof Response) {
    res.responseApi.send()
  } else {
    logger.info('Api/Response', 'response is not an instance of Response')
  }
  next()
}
