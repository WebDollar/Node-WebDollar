const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const isProd = process.env.NODE_ENV === 'production'
//const isAnalyze = process.argv.includes('--analyze') || process.argv.includes('--analyse');
const isAnalyze = false;

module.exports = {

    //define entry point
    entry: ['babel-regenerator-runtime'],
    devtool: isProd
        ? false
        : '#cheap-module-source-map',
    // send to distribution
    output: {
        path: path.resolve(__dirname, '../dist_bundle'),
        publicPath: '/dist/',
        filename: '[name].[chunkhash].js'
    },
    resolve: {
        alias: {
            'src': path.resolve(__dirname + '/../src'),
            'applications': path.resolve(__dirname + '/../src/applications'),
            'main-blockchain': path.resolve(__dirname + '/../src/main-blockchain'),
            'node': path.resolve(__dirname + '/../src/node'),
            'consts': path.resolve(__dirname + '/../src/consts'),
            'common': path.resolve(__dirname + '/../src/common'),
            'tests': path.resolve(__dirname + '/../src/tests'),
        }
    },
    module: {
        noParse: /es6-promise\.js$/, // avoid webpack shimming process

        rules: [

        ],

        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
                exclude: [/node_modules/],
                query: {
                    presets: ['es2017', "env"],
                }
            },
        ]

    },

    plugins:
        isProd
            ? [
                ...isAnalyze ? [new BundleAnalyzerPlugin()] : [],

                new webpack.optimize.UglifyJsPlugin({
                    compress: { warnings: false }
                }),
                new ExtractTextPlugin({
                    filename: 'common.[chunkhash].css'
                })
            ]
            : [
                ...isAnalyze ? [new BundleAnalyzerPlugin()] : [],
                new FriendlyErrorsPlugin()
            ]

}