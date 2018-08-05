const path = require('path');
const webpack = require('webpack');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    target: 'node',

    //define entry point
    entry: {
        app: "./src/common/blockchain/interface-blockchain/mining/backbone/workers/Backbone-Worker.js",
    },

    // send to distribution
    output: {
        filename: 'dist_bundle/terminal_worker.js',
    },

    resolve: {
        alias: {
            // 'src': path.resolve(__dirname + '/../src'),
            'applications': path.resolve(__dirname + '/../src/applications'),
            'main-blockchain': path.resolve(__dirname + '/../src/main-blockchain'),
            'node': path.resolve(__dirname + '/../src/node'),
            'consts': path.resolve(__dirname + '/../src/consts'),
            'common': path.resolve(__dirname + '/../src/common'),
        }
    },
    externals: nodeExternals({})
};
