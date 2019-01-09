const webpack = require('webpack')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const rmrf = require('rimraf')

var hasDashBoard = process.argv.includes('dashboard')
if (hasDashBoard) {
  var Dashboard = require('webpack-dashboard');
  var DashboardPlugin = require('webpack-dashboard/plugin');
  var dashboard = new Dashboard();
}

const config = require('../lib/config')
const resolve = require('../lib/resolve')
const { isDev, type } = require('../lib/args')
const packageList = require('../lib/ps')
const build = require('../bin/build')
const { packages, pages } = require('../lib/fs.js')

const options = {
  /**
   * 热更新调试配置
   */
  devServer: {
    host: config.dev.host,    // 服务器的IP地址，可以使用IP也可以使用localhost
    compress: true,    // 服务端压缩是否开启
    port: config.dev.port, // 端口
    hot: true, //热替换
    noInfo: true,
    stats: 'errors-only',
    overlay: { //页面弹出错误信息
      warnings: false,
      errors: true
    },
    progress: true, //输出进度到控制台
    quiet: true
  },
  /**
   * sourceMap配置
   * ---------------------------------------------------------------------------------------
   * devtool	                      build	rebuild	production	quality
   * ---------------------------------------------------------------------------------------
   * (none)                          +++   +++     yes         bundled code
   * eval                            +++   +++     no          generated code
   * cheap-eval-source-map           +     ++      no          transformed code (lines only)
   * cheap-module-eval-source-map    o     ++      no          original source (lines only)
   * eval-source-map                 --    +       no          original source
   * cheap-source-map                +     o       yes         transformed code (lines only)
   * cheap-module-source-map         o     -       yes         original source (lines only)
   * inline-cheap-source-map         +     o       no          transformed code (lines only)
   * inline-cheap-module-source-map  o     -       no          original source (lines only)
   * source-map                      --    --      yes         original source
   * inline-source-map               --    --      no          original source
   * hidden-source-map               --    --      yes         original source
   * nosources-source-map            --    --      yes         without source content
   * ---------------------------------------------------------------------------------------
   * tips：+提速 o一般 -缓慢
   * ---------------------------------------------------------------------------------------
   */
  devtool: isDev ? config.dev.devtool : config.build.devtool,
  /**
   * 入口文件
   */
  // entry:{
  //   'base/home': './src/modules/base/home/index.js'
  // },
  /**
   * 输出配置
   */
  // output: {
  //   path: resolve(config.default.output),
  //   filename: `[name].js`,
  //   publicPath: type === 'single' ? './' : '../../'
  // },
  /**
   * 插件
   */
  plugins: [
    new webpack.HotModuleReplacementPlugin(), //热更新
    ...config.default.plugins
  ],
  externals: config.default.externals,
  /**
   * 解析
   */
  resolve: config.default.resolve,
  /**
   * 模块
   */
  module: {
    rules: [
      ...config.default.loader,
      type === 'single' ? {
        test: /src[\/|\\]modules[\/|\\][_a-zA-Z0-9]+[\/|\\][_a-zA-Z0-9]+[\/|\\][_a-zA-Z0-9]+[\/|\\]index.js/,
        use: {
          loader: 'vue-splitter/loader/pagesLoader.js',
        } 
      } : {}
    ]
  }
}

const configEnv = {}
const configGlobal = {}
for (key in config.default.global) {
  configGlobal[key] = JSON.stringify(config.default.global[key])
}
for (key in config.default.env) {
  configEnv[key] = JSON.stringify(config.default.env[key])
}

const rm = function (md, env) {
  if (isDev) {
    op(md, env)
  } else {
    rmrf(resolve(config.default.output), function() {
      op(md, env)
    })
  }
}

const op = function (md, env) {
  var pageList = pages(md)
  var entry = packageList(md, pageList)
  var staticdir = 'static'
  var staticPublicPath = '../../'
  if (typeof config.static == 'object') {
    staticdir = eval(config.static.path)
    staticPublicPath = eval(config.static.publicPath)
  } else if (typeof config.static == 'string') {
    staticdir = eval(config.static)
  }

  options.plugins = [
    ...options.plugins,
    new webpack.DefinePlugin({
      'Global': configGlobal,
      'ENV': configEnv[env]
    }),
    new CopyWebpackPlugin([
      { 
        from: resolve('static'), 
        to: resolve(`${config.default.output}/${staticdir}`)
      }
    ])
  ]
  if (hasDashBoard) {
    options.plugins.push(new DashboardPlugin(dashboard.setData))
  } else {
    if (isDev) {
      options.plugins.push(new FriendlyErrorsWebpackPlugin({
        compilationSuccessInfo: {
          messages: [`应用已启动，请访问：http://${config.dev.host}:${config.dev.port}`]
        }
      }))
    }
  }
  if (isDev) {
    options.mode = 'development'
  }


  if (type === 'single') {
    options.externals.pages = JSON.stringify(pageList)
    options.entry = entry
    options.entry[`${staticdir}/js/main`] = entry['main']
    delete options.entry.main
    options.output = {
      path: resolve(config.default.output),
      filename: `[name].js`
    }
    options.plugins.push(
      new HtmlWebpackPlugin({ //入口配置
        filename: `index.html`,// 生成文件名
        template: 'index.html', // 模板文件
        chunks: [`${staticdir}/js/main`],
        static: staticdir
      })
    )
    build([options])
  } else {
    if (md.length == 0) {
      md = packages
    }
    var optionsList = md.map((a) => {
      var entrys = {}
      var hwp = []
      var output = {}
      for (var i in entry) {
        var name = i.split('/')
        if (name[0] == a) {
          output = {
            path: `${resolve(config.default.output)}/${name[0]}`,
            filename: `[name].js`,
            publicPath: '../'
          }
          entrys[`${name[1]}/${name[2]}`] = entry[i]
          hwp.push(
            new HtmlWebpackPlugin({ //入口配置
              filename: `${name[1]}/${name[2]}.html`,// 生成文件名
              template: 'index.html', // 模板文件
              chunks: [`${name[1]}/${name[2]}`],
              static: staticPublicPath + staticdir
            })
          )
        }
      }
      return {
        mode: 'production',
        ...options,
        output,
        entry: entrys,
        plugins: [
          ...options.plugins,
          ...hwp
        ]
      }
    })
    build(optionsList)
  }
}

module.exports = rm;