const rl = require('./lib/rl')
const env = require('./lib/env')
const { packages } = require('./lib/fs.js')

env().then((env) => {
  rl(packages).then(function (md) {
    require('./bin/index')(md, env)
  })
})
