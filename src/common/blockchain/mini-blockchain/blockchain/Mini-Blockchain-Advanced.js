import consts from "consts/const_global";
import MiniBlockchain from "./Mini-Blockchain";
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import global from "consts/global"

class MiniBlockchainAdvanced extends  MiniBlockchain{

    constructor (agent){

        super(agent);

        this.lightAccountantTreeSerializations = {};
    }


    async _onBlockCreated(block, saveBlock){

        await MiniBlockchain.prototype._onBlockCreated.call(this, block, saveBlock);

        if ( ! block.blockValidation.blockValidationType["skip-saving-light-accountant-tree-serializations"] ){

            let serialization = this.accountantTree.serializeMiniAccountant();
            this.lightAccountantTreeSerializations[block.height+1] = serialization;

            //delete old lightAccountantTreeSerializations

            let index = this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES - 2;

            while (this.lightAccountantTreeSerializations[index] !== undefined){
                delete this.lightAccountantTreeSerializations[index];
                this.lightAccountantTreeSerializations[index] = undefined;
                index--;
            }

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

            global.MINIBLOCKCHAIN_ADVANCED_SAVED = false;

            console.log("saving started");

            if (! (await this.inheritBlockchain.prototype.saveBlockchain.call(this, startingHeight, endingHeight)))
                throw {message: "couldn't sae the blockchain"};


            if (this.blocks.length > consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES) {

                if (! (await this.db.save("lightAccountantTreeAdvanced_offset", consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES )))
                    throw {message: "Couldn't be saved _lightAccountantTreeAdvanced_offset", index: this._blockchainFileName + consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES};

                await this.sleep(70);

                if (!(await this.accountantTree.saveMiniAccountant( true, "lightAccountantTreeAdvanced", this.lightAccountantTreeSerializations[this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES + 1])))
                    throw {message: "saveMiniAccountant couldn't be saved"};

                await this.sleep(80);
            }

            console.log("saving ended");

        } catch (exception){
            console.error("Couldn't save MiniBlockchain", exception);
            global.MINIBLOCKCHAIN_ADVANCED_SAVED = true;
            return false;
        }

        global.MINIBLOCKCHAIN_ADVANCED_SAVED = true;
        return true;

    }

    async _loadBlockchain(){

        if (process.env.BROWSER)
            return true;

        //AccountantTree[:-BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS]

        try {

            if (process.env.FORCE_LOAD !== undefined) throw "load blockchain simple" ;

            let offset = await this.db.get("lightAccountantTreeAdvanced_offset");

            if (offset === null || offset < consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES)
                throw "load blockchain simple";

            if (!(await this.accountantTree.loadMiniAccountant(undefined, undefined, true,  "lightAccountantTreeAdvanced")))
                throw "load blockchain simple";

            let answer = await this.inheritBlockchain.prototype._loadBlockchain.call(this, undefined, offset);

            if (!answer) {
                //couldn't load the last K blocks
                console.error("couldn't load the last K blocks");

                await this.accountantTree.loadMiniAccountant(new Buffer(0));
                throw "load blockchain simple"; //let's force to load a simple blockchain
            }

        } catch (exception){

            if (exception === "load blockchain simple") {
                let answer = await this.inheritBlockchain.prototype._loadBlockchain.call(this);

                if (answer)
                    await this.saveBlockchain(this.blocks.length, this.blocks.length);

            }
        }

        return false;

    }


}

export default MiniBlockchainAdvanced
