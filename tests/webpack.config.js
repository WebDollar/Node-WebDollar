const path          = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
    output: {
        // use absolute paths in sourcemaps (important for debugging via IDE)
        devtoolModuleFilenameTemplate: '[absolute-resource-path]',
        devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
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
    target: 'node', // webpack should compile node compatible code
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    devtool: 'inline-cheap-module-source-map'
};
