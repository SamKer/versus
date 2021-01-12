require('dotenv').config()

module.exports = {
  apps: [{
    name: 'Versus',
    script: 'api.js',
    instances: 1,
    autorestart: true,
    watch: ['server'],
    max_memory_restart: '1G'
  }
  ]
}
