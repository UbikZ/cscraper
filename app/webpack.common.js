const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const PrepackWebpackPlugin = require('prepack-webpack-plugin');

const variables = {
  paths: {
    dist: path.resolve(__dirname, 'dist'),
    src: path.resolve(__dirname, 'src'),
  }
};

module.exports = {
  variables,
  config: {
    entry: path.join(variables.paths.src, 'app.js'),
    output: {
      path: variables.paths.dist,
      filename: '[name].bundle.js',
      chunkFilename: '[name].bundle.js',
    },
    plugins: [
      new PrepackWebpackPlugin(),
      new HtmlWebpackPlugin({
        template: path.join(variables.paths.src, 'index.html'),
      }),
      new CleanWebpackPlugin([variables.paths.dist]),
      new webpack.DefinePlugin({
        'process.env.ES_ENDPOINT': JSON.stringify(process.env.ES_ENDPOINT)
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        minChunks: function (module) {
          return module.context && module.context.indexOf('node_modules') !== -1;
        }
      }),
    ],
    module: {
      rules: [
        {
          test: /\.js$/,
          include: variables.paths.src,
          use: [
            'babel-loader',
          ],
        }
      ],
    },
    resolve: {
      extensions: ['.js'],
    }
  }
};
