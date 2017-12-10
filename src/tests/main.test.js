if((typeof window !== 'undefined' && !window._babelPolyfill) ||
    (typeof global !== 'undefined' && !global._babelPolyfill)) {
    require('babel-polyfill')
}

if (typeof describe !== 'undefined') {


    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-Address.test');
	
	require ('tests/indexeddb-js/Interface-IndexedDB.test');
	
    require ('tests/trees/radix/Interface-Radix-Tree.test');
    require ('tests/trees/radix/accountant/Interface-Accountant-Radix-Tree.test');

    require ('tests/trees/Interface-Merkle-Tree.test');
    require ('tests/trees/radix/Interface-Merkle-Radix-Tree.test');

    require ('tests/crypto/WebDollar-Crypto.test');
    require ('tests/crypto/Argon2.test');

	require ('tests/big-number/Interface-BigNumber.test');

    //require ('tests/blockchain/Node-Web-Peer.test')


}