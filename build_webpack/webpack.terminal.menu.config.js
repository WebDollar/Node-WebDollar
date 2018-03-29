const webpack = require('webpack');
const base = require('./webpack.terminal.config');
const merge = require('webpack-merge');
const nodeExternals = require('webpack-node-externals');

const config = merge(base, {
    target: 'node',

    //define entry point
    entry: {
        app: "./src/node/menu/CLI-Menu.js",
    },
    output: {
        filename: 'terminal-menu-bundle.js',
        libraryTarget: 'commonjs2'
    }

});

module.exports = config