if(( typeof window !== 'undefined' && !window._babelPolyfill) ||
    ( typeof global !== 'undefined' && !global._babelPolyfill)) {
    require('babel-polyfill')
}

if ( typeof describe !== 'undefined') {


    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-Address.test');
    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-Difficulty.test');
    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-Block-LocalStore.test');
    require ('tests/blockchain/protocol/Interface-Blockchain-Protocol-Fork-Solver.test');

    require ('tests/satoshmindb/Interface-SatoshminDB.test');
    require ('tests/main-blockchain/Main-Blockchain-Wallets.test');

    require ('tests/trees/radix/Interface-Radix-Tree.test');
    require ('tests/trees/radix/accountant/Interface-Accountant-Radix-Tree.test');

    require ('tests/trees/Interface-Merkle-Tree.test');
    require ('tests/trees/radix/merkle-tree/Interface-Merkle-Radix-Tree.test');
    require ('tests/trees/radix/accountant/merkle-tree/Interface-Merkle-Accountant-Radix-Tree.test');

    require ('tests/crypto/WebDollar-Crypto.test');
    require ('tests/crypto/Argon2.test');

	require ('tests/utils/big-number/BigNumber.test');
	require ('tests/utils/serialization/Serialization.test');

    //require ('tests/blockchain/Node-Web-Peer.test')


}