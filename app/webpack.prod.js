const webpack = require('webpack');
const merge = require('webpack-merge');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CompressionPlugin = require("compression-webpack-plugin");
const PreloadWebpackPlugin = require('preload-webpack-plugin');

const common = require('./webpack.common.js');

const extractSass = new ExtractTextPlugin({
  filename: "[name].bundle.css?v=[contenthash]"
});

module.exports = merge(common.config, {
  devtool: 'cheap-module-source-map',
  cache: false,
  output: {
    filename: '[name].bundle.js?v=[chunkhash]',
  },
  module: {
    rules: [{
      test: /\.s?css$/,
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
    new webpack.optimize.UglifyJsPlugin({
      compress: {
        warnings: false,
        pure_getters: true,
        unsafe: true,
        unsafe_comps: true,
        screw_ie8: true
      },
      output: {
        comments: false,
      },
      exclude: [/\.min\.js$/gi]
    }),
    new CompressionPlugin({
      test: /\.(js|css)$/,
      asset: '[path].gz?[query]'
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production')
    }),
    new PreloadWebpackPlugin({
      rel: 'preload',
      as: 'script',
      include: 'all',
      fileBlacklist: [/\.(css|map)$/]
    }),
    new webpack.HashedModuleIdsPlugin(),
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks(module) {
          return module.context && module.context.indexOf('node_modules') >= 0;
        }
      }
    ),
    extractSass,
  ],
  performance: {
    maxAssetSize: 200000,
    hints: 'warning'
  },
});
