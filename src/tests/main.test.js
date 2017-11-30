if((typeof window !== 'undefined' && !window._babelPolyfill) ||
    (typeof global !== 'undefined' && !global._babelPolyfill)) {
    require('babel-polyfill')
}

if (typeof describe !== 'undefined') {


    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-Address.test')
    require ('tests/blockchain/interface-blockchain/trees/Interface-Radix-Tree.test')
    require ('tests/blockchain/crypto/WebDollar-Crypto.test')
    require ('tests/crypto/Argon2.test')


    //require ('tests/blockchain/Node-Web-Peer.test')


}