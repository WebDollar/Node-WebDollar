var assert = require('assert')

import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import InterfaceBlockchainBlock from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block'
import consts from 'consts/const_global'
import Blockchain from 'main-blockchain/Blockchain';

describe('test Interface-Blockchain save/load/remove to/from local storage', () => {

    let blockchain = null;
    let response = null;
    
    it('save/load/remove blockchain, sample test', async () => {

        blockchain = new InterfaceBlockchain();
        //create dummy blocks

        //it requires real data
        let b0 = new InterfaceBlockchainBlock( Blockchain.blockchain, Blockchain.blockchain.createBlockValidation(), consts.TRANSACTIONS.VERSIONS.SCHNORR_VERSION, new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), undefined, undefined, undefined, 0, blockchain.db );
        let b1 = new InterfaceBlockchainBlock( Blockchain.blockchain, Blockchain.blockchain.createBlockValidation(), consts.TRANSACTIONS.VERSIONS.SCHNORR_VERSION, new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), undefined, undefined, undefined, 1, blockchain.db );
        let b2 = new InterfaceBlockchainBlock( Blockchain.blockchain, Blockchain.blockchain.createBlockValidation(), consts.TRANSACTIONS.VERSIONS.SCHNORR_VERSION, new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), undefined, undefined, undefined, 2, blockchain.db );
        let b3 = new InterfaceBlockchainBlock( Blockchain.blockchain, Blockchain.blockchain.createBlockValidation(), consts.TRANSACTIONS.VERSIONS.SCHNORR_VERSION, new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), new Buffer(consts.BLOCKCHAIN.BLOCKS_POW_LENGTH), undefined, undefined, undefined, 3, blockchain.db );

        blockchain.blocks.addBlock(b0);
        blockchain.blocks.addBlock(b1);
        blockchain.blocks.addBlock(b2);
        blockchain.blocks.addBlock(b3);

        response = await blockchain.saveBlockchain();
        assert(response === true, 'save: ' + response);

        /*
            this test will fail because it requires real blocks
         */

        assert(response === true, 'load: ' + response);

        await b0.loadBlock();
        await b1.loadBlock();
        await b2.loadBlock();
        await b3.loadBlock();



        assert(blockchain.blocks.length === 4, 'blockchain should have 4 blocks ' + blockchain.blocks.length);
        assert(blockchain.blocks[0].equals(b0), 'load: blocks0 differ after load');
        assert(blockchain.blocks[1].equals(b1), 'load: blocks1 differ after load');
        assert(blockchain.blocks[2].equals(b2), 'load: blocks2 differ after load');
        assert(blockchain.blocks[3].equals(b3), 'load: blocks3 differ after load');

        assert(blockchain.blocks.length === 4, 'load: blocks.length=' + blockchain.blocks.length);
        
        response = await blockchain.removeBlockchain(0);
        assert(response === true, 'remove: ' + response);
    });

});
