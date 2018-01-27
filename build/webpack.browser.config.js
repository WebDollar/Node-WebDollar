const webpack = require('webpack')
const base = require('./webpack.base.config')
const merge = require('webpack-merge')

const config = merge(base, {

    //define entry point
    entry: {
        app: "./src/build_browser.js",
    },
    output: {
        filename: 'browser/browser-bundle.js',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        alias: { //see vue-Frontend for demo

        }
    }

});

module.exports = config