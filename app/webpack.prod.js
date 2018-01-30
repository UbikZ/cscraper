const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const common = require('./webpack.common.js');

const extractSass = new ExtractTextPlugin({
  filename: "[name].bundle.css?v=[contenthash]"
});

module.exports = merge(common.config, {
  devtool: 'source-map',
  output: {
    filename: '[name].bundle.js?v=[chunkhash]',
  },
  module: {
    rules: [{
      test: /\.scss$/,
      use: extractSass.extract({
        use: [{
          loader: "css-loader", options: {minimize: true}
        }, {
          loader: "sass-loader"
        }]
      })
    }]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(common.variables.paths.src, 'index.prod.html'),
    }),
    new UglifyJSPlugin({
      sourceMap: true
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.optimize.CommonsChunkPlugin({name: 'vendor'}),
    extractSass,
  ],
  performance: {
    maxAssetSize: 200000,
    maxEntrypointSize: 200000,
    hints: 'warning'
  },
});
