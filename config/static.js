const {
  __isEmptyObject
} = require('../lib/help')
const config = require('../lib/config')

/**
 * 默认静态目录输出名为static
 * 默认静态文件引入路径为 ../../ + static
 */
var staticDir = 'static'
var staticPublicPath = '../../'

/**
 * 对应配置文件static字段
 * 如果为字符串则配置输出名
 * 如果为object，static.path为目录输出名，static.publicPath为引入前缀 
 */
if (!__isEmptyObject(config.static)) {
  if (typeof config.static == 'object') {
    staticdir = eval(config.static.path)
    staticPublicPath = eval(config.static.publicPath)
  } else if (typeof config.static == 'string') {
    staticdir = eval(config.static)
  }
}

module.exports = {
  path: staticDir,
  publicPath: staticPublicPath
}