const webpack = require('webpack')
const base = require('./../webpack.terminal.config')
const merge = require('webpack-merge')

const config = merge(base, {

    //define entry point
    entry: {
        app: "./src/tests/main.test.js",
    },

    output: {
        filename:'terminal-mocha-bundle.js'
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

    // Nicio definire a 'process.env' întreg aici: ar îngheța la build toate
    // variabilele de mediu citite la runtime (ex. FALLBACK_NODES), exact
    // problema deja evitată în webpack.terminal.config.js pentru build-ul real.
    // 'MOCHA_TESTS' nu era folosit nicăieri în src/ — eliminat, nu înlocuit.

});

module.exports = config