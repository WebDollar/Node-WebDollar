//tutorial based on https://stackoverflow.com/questions/32385219/mocha-tests-dont-run-with-webpack-and-mocha-loader
module.exports = {
    entry: 'mocha!./../../src/tests/tests.index.js',
    output: {
        filename: 'test.build.js',
        path: '/tests/',
        publicPath: 'http://127.0.0.1:' + 6666 + '/tests'
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loaders: ['babel-loader'],
                exclude: [/node_modules/],

            },

        ]
    },
    devServer: {
        host: '127.0.0.1',
        port: 6666
    }
};