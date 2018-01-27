const webpack = require('webpack')
const base = require('./../webpack.browser.config')
const merge = require('webpack-merge')

const config = merge(base, {

    //define entry point
    entry: {
        app: "./src/tests/main.test.js",
    },

    output: {
        filename:'browser/mocha/browser-mocha-bundle.js'
    },

    module:{
        loaders: [
            {
                test: /test\.js$/,
                use: 'mocha-loader',
                exclude: /node_modules/,
            }
        ]
    },

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                MOCHA_TESTS: 'true'
            }
        })
    ]


});

module.exports = config