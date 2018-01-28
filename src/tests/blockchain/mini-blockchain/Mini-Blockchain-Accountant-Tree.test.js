var assert = require('assert')
const colors = require('colors/safe');

import Blockchain from 'main-blockchain/Blockchain';
import MiniBlockchainAccountantTree from 'common/blockchain/mini-blockchain/state/Mini-Blockchain-Accountant-Tree'
import InterfaceBlockchainAddressHelper from 'common/blockchain/interface-blockchain/addresses/Interface-Blockchain-Address-Helper'

describe('MiniBlockchainAccountantTree', () => {

    it('save MiniBlockchainAccountantTree Tree', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);

        Tree.updateAccount("WEBD$gAWbRegeuENxh8SXRJgns6pWZ#&rZHqG#bCPUh35Zkxpbo1s%HsPw==", 10);
        Tree.updateAccount("WEBD$gAvuc$kGH1LQSYo62mPT#YpaVu*pH54rGxWmXfD5NaXi#Nu8svsPw==", 12);
        Tree.updateAccount("WEBD$gB3TtEpjSy6ts1zToLMm9YUa5NJgh6i2pLhzA$5FXQCe6R%i17sPw==", 13);
        Tree.updateAccount("WEBD$gB34HQUEPTP4GgLJ9M4muGQfS5Q4EC1E1z$f&eASjs6eH1mbezsPw==", 15);

        let rootHash = Tree.root.hash.sha256;

        assert(!rootHash.equals(new Buffer(32)), "root hash is not valid "+rootHash.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        console.log("response", response);
        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        Tree.root = Tree.createNode(null,  [], null );

        response = await Tree.loadMiniAccountant(undefined,undefined, true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(rootHash.equals(Tree.root.hash.sha256), " root hash is not the same: " +rootHash.toString("hex")+"  "+Tree.root.hash.sha256.toString("hex"));

    });


    it('save MiniBlockchainAccountantTree Tree multiple tests', async () => {

        let Tree = new MiniBlockchainAccountantTree(Blockchain.blockchain.db);


        let list = [];
        for (let i=0; i<100; i++){
            let address = InterfaceBlockchainAddressHelper.generateAddress();

            let found =false;
            for (let j=0; j<list.length; j++)
                if (list[j].address === address.address){
                    found = true;
                    break;
                }

            if (!found)
                list.push ( {address:address.address, value: Math.floor(Math.random()*1000) } );
        }

        for (let i=0; i<list.length; i++){

            try {
                Tree.updateAccount(list[i].address, list[i].value);
            } catch (exception){
                console.log(colors.red("error updating Account"), i, list[i]) ;
                throw exception;
            }

        }

        let rootHash = Tree.root.hash.sha256;

        assert(!rootHash.equals(new Buffer(32)), "root hash is not valid "+rootHash.toString("hex"));

        let response = await Tree.saveMiniAccountant(true, "MiniBlockchainAccountantTree.test");

        console.log("response", response);
        assert(response === true, 'save miniblockchain accountant tree : ' + response);

        Tree.root = Tree.createNode(null,  [], null );

        response = await Tree.loadMiniAccountant(undefined,undefined,true, "MiniBlockchainAccountantTree.test");
        assert(response === true, 'load miniblockchain accountant tree: ' + response);

        assert(rootHash.equals(Tree.root.hash.sha256), " root hash is not the same: " +rootHash.toString("hex")+"  "+Tree.root.hash.sha256.toString("hex"));

    });

});
