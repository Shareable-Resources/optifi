// `CheckerPlugin` is optional. Use it if you want async error reporting.
// We need this plugin to detect a `--watch` mode. It may be removed later
// after https://github.com/webpack/webpack/issues/3460 will be resolved.
const { CheckerPlugin } = require('awesome-typescript-loader')
const path = require('path');

module.exports = {

  // Currently we need to add '.ts' to the resolve.extensions array.
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },

  // Source maps support ('inline-source-map' also works)
  devtool: 'source-map',

  // Add the loader for .ts files.
  module: {
    rules: [
      {
        test: /\.ts$|tsx/,
        loader: ['babel-loader', 'awesome-typescript-loader'],
      }
    ],
    loaders: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"},
      { test: /\.json$/, loader: 'json-loader' },
    ]
  },
  node: {
    fs: "empty"
  },
  plugins: [
      new CheckerPlugin()
  ],
  alias: {
    "npm-library": path.resolve(__dirname, "node_modules/@optifi/optifi-sdk/")
  },
};