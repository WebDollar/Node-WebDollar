const webpack = require('webpack')
const base = require('./webpack.base.config')
const merge = require('webpack-merge')

console.log("WEBPACK_TYPE", process.env.WEBPACK_TYPE);


let outputPath;

if (process.env.WEBPACK_TYPE === 'browser_test') outputPath = 'browser/browser-bundle.js';
else if (process.env.WEBPACK_TYPE === undefined) outputPath = './../../vue-Frontend/public/WebDollar-dist/WebDollar-Protocol-bundle.js';
else if (process.env.WEBPACK_TYPE === 'user_interface') outputPath = ' ./../../../User-Interface-WebDollar/dist_bundle/WebDollar-Protocol-bundle.js';

console.log("process.env.WEBPACK_TYPE", process.env.WEBPACK_TYPE)
console.log("process.env.WEBPACK_TYPE", outputPath)

const config = merge(base, {
    target: 'web',

    node: {
        console: false,
        child_process: "empty",
        dgram: "empty",
        fs: 'empty',
        net: 'empty',
        tls: 'empty',
        uws: 'empty'
    },

    //define entry point
    entry: {
        app: "./src/build_browser.js",
    },
    output: {
        filename: outputPath,
    },
    resolve: {
        alias: { //see vue-Frontend for demo

        }
    },

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                BROWSER: 'true'
            }
        })
    ]

});

module.exports = config