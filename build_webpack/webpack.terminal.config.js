/* eslint-disable */
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
        // Doar BROWSER și GH_COMMIT se fixează la build; restul variabilelor de mediu
        // (SERVER_PORT, JSON_RPC_*, NETWORK etc.) se citesc la rulare, ca bundle-ul să fie configurabil de utilizator.
        new webpack.DefinePlugin({
            'process.env.BROWSER': 'false',
            'process.env.GH_COMMIT': JSON.stringify(process.env.GH_COMMIT || ''),
        })
    ]

});

module.exports = config
