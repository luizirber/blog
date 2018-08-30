const path = require('path')

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
  mode: 'development',
  target: 'web'
}
