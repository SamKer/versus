const express = require('express')
const config = require('./lib/config')
const router = express.Router()
// const app = express();

/* middleware */
const errorHandler = require('./middlewares/error')
const {urlencoded, json} = require('./middlewares/bodyparser')
const {prepend, append} = require('./middlewares/response')
const {aclIsAdmin, aclIsClient} = require('./middlewares/acl')
const mwReqId = require('./middlewares/reqid')
const auth = require('./middlewares/auth')

router.use(errorHandler)
router.use(urlencoded)
router.use(json)
router.use(mwReqId)


//STATIC
//test unitaire
//router.use('/tests', prepend, auth, aclIsAdmin, express.static(config.web_path +'/tests'));
//specs
//router.use('/specs', prepend, auth, aclIsAdmin, express.static(config.web_path +'/specs'));
//doc api
//router.use(prepend, auth, aclIsClient, express.static(config.web_path + '/apidoc'));

//API
router.get('/status', prepend, require('./routes/status'), append)
router.get('/ping', prepend, require('./routes/ping'), append)

//add video
router.post('/ytdl', prepend, auth, aclIsAdmin, require('./routes/ytdl'), append)
router.get('/videos/news', prepend, auth, aclIsAdmin, require('./routes/videosNews'), append)

module.exports = router
