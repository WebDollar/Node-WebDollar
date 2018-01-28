var assert = require('assert')

import Blockchain from 'main-blockchain/Blockchain';
import MiniBlockchainAccountantTree from 'common/blockchain/mini-blockchain/state/Mini-Blockchain-Accountant-Tree'

describe('MiniBlockchainAccountantTree', () => {

    it('save MiniBlockchainAccountantTree Tree', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        Tree.updateAccount("WEBD$gAWbRegeuENxh8SXRJgns6pWZ#&rZHqG#bCPUh35Zkxpbo1s%HsPw==", 10);
        Tree.updateAccount("WEBD$gAvuc$kGH1LQSYo62mPT#YpaVu*pH54rGxWmXfD5NaXi#Nu8svsPw==", 12);
        Tree.updateAccount("WEBD$gB3TtEpjSy6ts1zToLMm9YUa5NJgh6i2pLhzA$5FXQCe6R%i17sPw==", 13);
        Tree.updateAccount("WEBD$gB34HQUEPTP4GgLJ9M4muGQfS5Q4EC1E1z$f&eASjs6eH1mbezsPw==", 15);

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        console.log("response", response);
        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        response = await Tree.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

    });

});
