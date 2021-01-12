const aclIsAdmin = (req, res, next) => {
  console.log(req.user)
  if (req.user.role !== 'admin') {
    res.responseApi.error(`Unauthorized: Access is denied for user ${req.user.login}`, 401)
    res.responseApi.send()
    return
  }
  next()
}

const aclIsClient = (req, res, next) => {
  if (req.user.role !== 'admin' &&
        req.user.role !== 'client') {
    res.responseApi.error(`Unauthorized: Access is denied for user ${req.user.login}`, 401)
    res.responseApi.send()
    return
  }
  next()
}

module.exports = {
  aclIsAdmin,
  aclIsClient
}
