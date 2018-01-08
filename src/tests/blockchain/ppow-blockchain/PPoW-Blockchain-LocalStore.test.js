var assert = require('assert')

import PPoWBlockchain from 'common/blockchain/ppow-blockchain/blockchain/PPoW-Blockchain'
import PPoWBlockchainBlock from 'common/blockchain/ppow-blockchain/blocks/PPoW-Blockchain-Block'
import consts from 'consts/const_global'

describe('test PPoW-Blockchain save/load/remove to/from local storage', () => {

    let blockchain = null;
    let response = null;
    
    it('save/load/remove ppow-blockchain, sample test', async () => {

        blockchain = new PPoWBlockchain();
        
    });

});
