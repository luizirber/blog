const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
  entry: './bootstrap.js',
  module: {
    rules: [
      {test: /\.wasm$/, type: 'webassembly/experimental'}
    ]
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/sourmash-wasm/dist/'
  },
  node: {
    zlib: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'index.template.ejs',
      inject: 'body'
    }),
    new CopyWebpackPlugin([
      { from: 'app.css' }
    ])
  ],
  mode: 'development',
  target: 'web'
}
