const webpack = require('webpack');
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

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
      new CleanWebpackPlugin([variables.paths.dist]),
      new webpack.DefinePlugin({
        'process.env.ES_ENDPOINT': JSON.stringify(process.env.ES_ENDPOINT)
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor'
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
    },
    externals: {
      'react': 'React',
      'redux': 'Redux',
      'react-dom': 'ReactDOM',
      'redux-thunk': 'ReduxThunk',
      'react-redux': 'ReactRedux',
      'react-router-dom': 'ReactRouterDOM',
      'prop-types': 'PropTypes'
    }
  }
};
