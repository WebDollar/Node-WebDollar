const webpack = require('webpack')
const base = require('./webpack.terminal.config')
const merge = require('webpack-merge')

const config = merge(base, {

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                START_MINING: 'true'
            }
        })
    ]

});

module.exports = config;