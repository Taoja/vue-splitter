const resolve = require('./resolve')
const { packages } = require('./fs')
const { type } = require('./args')
const config = require('../lib/config')

const packageList = function (e, pages) {
  if (e.length === 0) {
    e = packages
  }
  var package = {}
  pages.forEach(function (a) {
    if (e.includes(a.package)) {
      var source = config.default.packages ? `src/modules/${a.module}/${a.page}/index.js` : `src/modules/${a.package}/${a.module}/${a.page}/index.js`
      package[`${a.package}/${a.module}/${a.page}`] = resolve(source)
    }
  })

  if (type === 'single') {
    package['main'] = resolve('src/index.js')
  }
  return package
}

module.exports = packageList
