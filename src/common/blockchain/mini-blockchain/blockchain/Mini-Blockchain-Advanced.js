import consts from "consts/const_global";
import MiniBlockchain from "./Mini-Blockchain";
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'

class MiniBlockchainAdvanced extends  MiniBlockchain{

    constructor (agent){

        super(agent);

        this.lightAccountantTreeSerializations = {};
    }


    /**
     * operate the mini-blockchain accountant tree
     * mini-blockchain, will update reward and take in consideration all transactions
     * @param block
     * @param resetMining
     * @param socketsAvoidBroadcast
     * @returns {Promise.<*>}
     */
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast, saveBlock, revertActions){

        if (block.height === 541){
            console.log("psss");
        }

        let answer = await MiniBlockchain.prototype.includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast, saveBlock, revertActions);

        let serialization = this.accountantTree.serializeMiniAccountant();
        this.lightAccountantTreeSerializations[block.height+1] = serialization;

        return true;
    }


    getSerializedAccountantTree(height){

        if (height < 0)
            height = -1;

        if (height === -1){
            let emptyAccountantTree = new MiniBlockchainAccountantTree(this.db);
            return emptyAccountantTree.serializeMiniAccountant();
        }

        if ( Buffer.isBuffer(this.lightAccountantTreeSerializations[height]) )
            return this.lightAccountantTreeSerializations[height];

        // else I need to compute it, by removing n-1..n
        throw {message: "not computed ", height:height};

    }


}

export default MiniBlockchain