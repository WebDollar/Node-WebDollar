import consts from "consts/const_global";
import MiniBlockchain from "./Mini-Blockchain";
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'

class MiniBlockchainAdvanced extends  MiniBlockchain{

    constructor (agent){

        super(agent);

        this.lightAccountantTreeSerializations = {};
    }


    async _onBlockCreated(block, saveBlock){

        await MiniBlockchain.prototype._onBlockCreated.call(this, block, saveBlock);

        let serialization = this.accountantTree.serializeMiniAccountant();
        this.lightAccountantTreeSerializations[block.height+1] = serialization;

        //delete old lightAccountantTreeSerializations


        let index = this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE;

        while (this.lightAccountantTreeSerializations[index] !== undefined){
            delete this.lightAccountantTreeSerializations[index];
            index--;
        }

    }


    getSerializedAccountantTree(height){

        if (height < 0)
            height = -1;

        if (height === -1){
            let emptyAccountantTree = new MiniBlockchainAccountantTree(this.db);
            let data =  emptyAccountantTree.serializeMiniAccountant();
            emptyAccountantTree.destroyTree();
            return data;
        }

        if ( Buffer.isBuffer(this.lightAccountantTreeSerializations[height]) )
            return this.lightAccountantTreeSerializations[height];

        // else I need to compute it, by removing n-1..n
        throw {message: "not computed ", height:height};

    }

    async saveBlockchain(startingHeight, endingHeight){

        if (process.env.BROWSER)
            return true;

        if (this.blocks.length === 0) return false;

        try {

            if (this.blocks.length > consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE)
                if (!(await this.accountantTree.saveMiniAccountant(true, "miniBlockchainAccountantTreeAdvanced", this.lightAccountantTreeSerializations[ this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE + 1 ])))
                    throw {message: "saveMiniAccountant couldn't be saved"};

            if (! (await this.inheritBlockchain.prototype.saveBlockchain.call(this, startingHeight, endingHeight)))
                throw {message: "couldn't sae the blockchain"};

            return true;

        } catch (exception){
            console.error("Couldn't save MiniBlockchain", exception);
            return false;
        }

    }

    async loadBlockchain(){

        if (process.env.BROWSER)
            return true;

        //AccountantTree[:-BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS]

        if (! (await this.accountantTree.loadMiniAccountant(undefined, undefined, true, "miniBlockchainAccountantTreeAdvanced"))) {

            return await this.inheritBlockchain.prototype.loadBlockchain.call( this );

        }

        let answer = await this.inheritBlockchain.prototype.loadBlockchain.call( this, undefined, consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE );

        if (!answer){

            //couldn't load the last K blocks
            console.warn("couldn't load the last K blocks");
            return await this.inheritBlockchain.prototype.loadBlockchain.call( this );

        }

    }


}

export default MiniBlockchainAdvanced
