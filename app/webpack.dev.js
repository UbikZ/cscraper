const path = require('path');
const merge = require('webpack-merge');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const common = require('./webpack.common.js');

module.exports = merge(common.config, {
  devtool: 'inline-source-map',
  devServer: {
    contentBase: common.variables.paths.src,
    hot: true
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.join(common.variables.paths.src, 'index.dev.html'),
    }),
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [{
          loader: "style-loader"
        }, {
          loader: "css-loader", options: {sourceMap: true}
        }, {
          loader: "sass-loader", options: {sourceMap: true}
        }]
      }
    ],
  },
});
