var assert = require('assert')

import Blockchain from 'main-blockchain/Blockchain';
import MiniBlockchainAccountantTree from 'common/blockchain/mini-blockchain/state/Mini-Blockchain-Accountant-Tree'

describe('MiniBlockchainAccountantTree', () => {

    it('save MiniBlockchainAccountantTree Tree', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        Tree.updateAccount("WEBD$gAWbRegeuENxh8SXRJgns6pWZ#&rZHqG#bCPUh35Zkxpbo1s%HsPw==", 10);
        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        response = await Tree.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load: ' + response);

    });


});
