const merge = require('webpack-merge');
const webpack = require('webpack');
const common = require('./webpack.common.js');

module.exports = merge(common.config, {
  devtool: 'inline-source-map',
  devServer: {
    contentBase: common.variables.paths.src,
    hot: true
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ],
  module: {
    rules: [
      {
        test: /\.s?css$/,
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
