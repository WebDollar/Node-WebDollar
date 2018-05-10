const webpack = require('webpack');
const base = require('./webpack.base.config');
const merge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');

const config = merge(base, {
    target: 'node',

    //define entry point
    entry: {
        app: "./src/build_terminal.js",
    },
    output: {
        filename: 'terminal-bundle.js',
        libraryTarget: 'commonjs2'
    },
    resolve: {
        alias: { //see vue-Frontend for demo

        }
    },
    externals: nodeExternals({

    }),

    plugins: [
        new webpack.DefinePlugin({
            "process.env": {
                BROWSER: 'false',
                SERVER_PORT: process.env.SERVER_PORT,
                INSTANCE_PREFIX: process.env.INSTANCE_PREFIX,
                MAXIMUM_CONNECTIONS_FROM_BROWSER: process.env.MAXIMUM_CONNECTIONS_FROM_BROWSER,
                MAXIMUM_CONNECTIONS_FROM_TERMINAL: process.env.MAXIMUM_CONNECTIONS_FROM_TERMINAL,
            }
        })
    ]

});

module.exports = config