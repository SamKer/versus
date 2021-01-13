require('dotenv').config()
const fs = require('fs')
const path = require('path')
const uuid = require('uuid');
const os = require('os')
const SymfonyStyle = require('symfony-style-console').SymfonyStyle
const config = require('./lib/config')
const logger = require('./lib/logger')
const Mongo = require('./lib/mongo')
const mailer = require('./lib/mailer')

/**
 * Versus full manager
 * @type {Versus}
 */
// eslint-disable-next-line no-unused-vars
const Versus = class Versus {
  constructor (handler) {
    this.project = 'Versus'
    this.version = config.version,
    this.root = __dirname
    this.env = process.env.NODE_ENV
    this.config = config
    this.handler = handler
    //this.cache = cache
    this.logger = logger
    this.mongo = Mongo
    this.handle = (a) => { console.log('no handler defined') }
    this.cpu = os.cpus().length
    this.mailer = mailer

    // additional dependencies for handlers
    switch (this.handler) {
      case 'command':
        this.logger._debug = false
        this.io = new SymfonyStyle()
        this.handle = this.handleCommand
        break
      case 'api':
        this.io = console
        this.handle = this.handleApi
        this.uuid = uuid
        this.express = require('express')
        this.app = this.express()
        break
      default:
        this.logger.error('Main', `handler ${this.handler} not expected`)
        break
    }
  }

  /**
     * parse argv
     * @param argv
     * @returns {{options: {}, arguments: [], cmd: *}}
     */
  parseArgv (argv) {
    const args = { cmd: (argv[2] ? argv[2] : false), options: {}, arguments: [] }
    let k = false
    let v = false
    for (let i = 3; i < argv.length; i++) {
      const p = argv[i]
      if (p.match('=')) {
        [k, v] = p.split('=')
        args.options[k] = v
      } else if (p.match('-')) {
        k = p
        v = argv[i + 1]
        i++
        args.options[k] = v
      } else {
        k = i
        v = argv[i]
        args.arguments.push(v)
      }
    }

    return args
  }

  /**
     * Parse argvs and run if command exist
     * @param argv
     */
  async handleCommand (argv) {
    try {
      const run = false
      argv = this.parseArgv(argv)
      if (argv.cmd === 0 || argv.cmd === false) {
        argv.cmd = 'help'
      }

      await this.mongo.connect()

      if (!run) {
        this.io.error(`no handler for command ${argv.cmd}`)
        return null
      }

      if (this.env === 'production' &&
                run.prod !== true) {
        this.io.error(`command ${argv.cmd} not available in env production`)
        return null
      }

      // show desc for cmd
      if (run.name !== 'help' &&
                (
                  ('-h' in argv.options) ||
                    ('--help' in argv.options)
                )
      ) {
        this.io.comment(`Info command ${run.app}:: ${run.name}`)
        run.showUsage(this.io)
        return null
      }
      this.io.comment(`running command ${run.app}:: ${run.name}`)
      const code = await run.execute(argv.options, argv.arguments, this.io, this)
      if (code === 1000) {
        this.io.comment('Prompt listening:')
      } else {
        await this.mongo.disconnect()
        this.io.success(`${this.project} end handler command`)
        process.exit(code)
        return null
      }
    } catch (e) {
      this.io.error(e.toString())
      process.exit(1)
      return null
    }
  }

  async handleApi () {
    try {
      await this.mongo.connect()

      // ADD Versus to req
      this.app.use((req, res, next) => {
        req.vs = this
        next()
      })

      // //test unitaire
      // app.use('/tests', aclIsAdmin ,express.static(__dirname+'/tests'));
      // //specs
      // app.use('/specs', aclIsAdmin ,express.static(__dirname+'/specs'));
      // //doc api
      // app.use(aclIsClient, express.static(__dirname+'/doc'));
      // this.app.use(this.express.static('apidoc'));

      // LOAD MIDDLEWARE && ROUTES
      const router = require('./router')
      this.app.use(router)

      // handle 404
      this.app.use('*', (req, res, next) => {
        res.status(404)
        res.set('Content-Type', 'application/json')
        res.send({ error: 'yo, no route here' })
      })
      // Handle 500
      this.app.use(function (error, req, res, next) {
        res.status(500)
        // res.render('500.jade', {title:'500: Internal Server Error', error: error});
        res.send(error)
      })

      // LISTENING
      this.app.listen(this.config.server.port, () => {
        logger.info('Server', `Listening on port ${this.config.server.url}:${this.config.server.port}`)
      })
    } catch (e) {
      this.logger.error('Main:Api', e.toString())
    }
  }
}

module.exports = Versus
