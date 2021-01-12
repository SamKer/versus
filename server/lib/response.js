module.exports = class Response {
  constructor (req, res) {
    this.res = res
    this.r = {
      request: {
        method: req.method,
        route: req.originalUrl
      },
      response: {
        status: 200,
        result: false,
        error: false
      }
    }
  }

  set status (status) {
    this.r.response.status = status
  }

  success (result, status) {
    this.r.response.status = status
    this.r.response.result = result
  }

  error (msg, status) {
    this.r.response.status = status
    this.r.response.error = msg
  }

  toJson () {
    return this.r
  }

  send () {
    this.res.set('Content-Type', 'application/json')
    this.res.set('Cache-Control', 'max-age=0, must-revalidate, private')
    this.res.status(this.r.response.status)
    this.res.send(this.toJson())
  }
}
