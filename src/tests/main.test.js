if(( typeof window !== 'undefined' && !window._babelPolyfill) ||
    ( typeof global !== 'undefined' && !global._babelPolyfill)) {
    require('babel-polyfill')
}

import Blockchain from 'main-blockchain/Blockchain'


if ( typeof describe !== 'undefined') {

    require('tests/blockchain/mini-blockchain/Mini-Blockchain-Accountant-Tree.test');

    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-Address.test');
    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-Difficulty.test');
    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-Block-LocalStore.test');
    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-LocalStore.test');
    require ('tests/blockchain/interface-blockchain/Interface-Blockchain-Transactions.test');

    require ('tests/blockchain/protocol/Interface-Blockchain-Protocol-Fork-Solver.test');

    require ('tests/blockchain/ppow-blockchain/PPoW-Blockchain-Block-LocalStore.test');
    require ('tests/blockchain/ppow-blockchain/PPoW-Blockchain-LocalStore.test');
    require ('tests/blockchain/ppow-blockchain/PPoW-Blockchain-Interlink.test');

    require ('tests/main-blockchain/Main-Blockchain-Wallets.test');
    require ('tests/main-blockchain/Interface-Blockchain-Address.test');

    require ('tests/satoshmindb/Interface-SatoshminDB.test');

    require ('tests/trees/radix/Interface-Radix-Tree.test');
    require ('tests/trees/radix/accountant/Interface-Accountant-Radix-Tree.test');

    require ('tests/trees/Interface-Merkle-Tree.test');
    require ('tests/trees/radix/merkle-tree/Interface-Merkle-Radix-Tree.test');
    require ('tests/trees/radix/accountant/merkle-tree/Interface-Merkle-Accountant-Radix-Tree.test');

    require ('tests/crypto/WebDollar-Crypto.test');
    require ('tests/crypto/Argon2.test');

    require ('tests/utils/big-number/BigNumber.test');
    require ('tests/utils/serialization/Serialization.test');

    require ('tests/utils/reward-simulator/RewardSimulator.test');

    require ('tests/blockchain/interface-blockchain/mining-pools/pool-management/PoolLeaderProtocol.test');
    require ('tests/blockchain/interface-blockchain/mining-pools/pool-management/PoolData.test');

    require ('tests/benchmarks/BigNumber-benchmark.test');

    // require ('tests/blockchain/Node-Web-Peer.test');


}

