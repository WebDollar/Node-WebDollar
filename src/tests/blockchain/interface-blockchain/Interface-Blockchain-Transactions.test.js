let assert = require('assert');

import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain';
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block';
import InterfaceBlockchainTransactions from 'common/blockchain/interface-blockchain/transactions/Interface-Blockchain-Transactions';
import consts from 'consts/const_global';

describe('test transactions', () => {

    let blockchain = null;
    let response = null;
    
    it('verify transactions, sample test', async () => {

        blockchain = new InterfaceBlockchain();
        //create dummy blocks
        let b0 = new InterfaceBlockchainBlock( blockchain, blockchain.blockValidation,  0, new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), undefined, undefined, undefined, 0, blockchain.db );

    });

});
