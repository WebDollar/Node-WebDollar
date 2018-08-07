import consts from "consts/const_global";
import MiniBlockchain from "./Mini-Blockchain";
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import global from "consts/global"
import Log from 'common/utils/logging/Log';
import GZip from "../../../utils/GZip";

class MiniBlockchainAdvanced extends  MiniBlockchain{

    constructor (agent){

        super(agent);

        this.lightAccountantTreeSerializations = {};
        this.lightAccountantTreeSerializationsGzipped = {};

    }


    async _onBlockCreated(block, saveBlock){

        await MiniBlockchain.prototype._onBlockCreated.call(this, block, saveBlock);

        if ( ! block.blockValidation.blockValidationType["skip-saving-light-accountant-tree-serializations"] ){

            let serialization = this.accountantTree.serializeMiniAccountant();
            this.lightAccountantTreeSerializations[block.height+1] = serialization;
            this.lightAccountantTreeSerializationsGzipped[block.height+1] = await GZip.zip(serialization);

            //delete old lightAccountantTreeSerializations

            let index = this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES_TO_DELETE - 2;

            while (this.lightAccountantTreeSerializations[index] !== undefined){
                delete this.lightAccountantTreeSerializations[index];
                delete this.lightAccountantTreeSerializationsGzipped[index];
                index--;
            }

        }

    }

    getSerializedAccountantTree(height, gzipped = false){

        if (height < 0)
            height = -1;

        if (height === -1){
            let emptyAccountantTree = new MiniBlockchainAccountantTree(this.db);
            let data =  emptyAccountantTree.serializeMiniAccountant();
            emptyAccountantTree.destroyTree();
            return data;
        }

        if ( Buffer.isBuffer(this.lightAccountantTreeSerializations[height]) ){

            if(gzipped)
                return this.lightAccountantTreeSerializationsGzipped[height];
            else
                return this.lightAccountantTreeSerializations[height];

        }

        // else I need to compute it, by removing n-1..n
        throw {message: "not computed ", height:height};

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

                Log.error("Couldn't load the last K blocks", Log.LOG_TYPE.SAVING_MANAGER);

                await this.accountantTree.loadMiniAccountant(new Buffer(0));

                throw "load blockchain simple"; //let's force to load a simple blockchain
            }

        } catch (exception){

            Log.error("Loading Blockchain Exception Couldn't load the last K blocks", Log.LOG_TYPE.SAVING_MANAGER, exception);

            if (exception === "load blockchain simple") {

                await this.inheritBlockchain.prototype._loadBlockchain.call(this);

            }
        }

        this._miniBlockchainSaveBlocks = this.blocks.length;

        return false;

    }

    async saveAccountantTree(serialization, length){

        global.MINIBLOCKCHAIN_ADVANCED_SAVED = false;

        try {

            if (length === undefined) length = this.blocks.length;

            if (length === 0) throw {message: "length is 0"};

            //avoid resaving the same blockchain
            if (this._miniBlockchainSaveBlocks === length) throw {message: "already saved"};

            Log.info('Accountant Tree Saving ', Log.LOG_TYPE.SAVING_MANAGER);

            if (await this.db.save(this._blockchainFileName, length) !== true)
                throw {message: "Error saving the blocks.length"};

            if (length < consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES) throw {message: "Couldn't save blockchain"};

            if (!(await this.db.save("lightAccountantTreeAdvanced_offset", consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES)))
                throw { message: "Couldn't be saved _lightAccountantTreeAdvanced_offset",  index: this._blockchainFileName + consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES };

            await this.sleep(70);

            if (serialization === undefined)
                serialization = this.lightAccountantTreeSerializations[length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES + 1];

            if (!(await this.accountantTree.saveMiniAccountant(true, "lightAccountantTreeAdvanced", serialization)))
                throw {message: "saveMiniAccountant couldn't be saved"};

            await this.sleep(70);

            this._miniBlockchainSaveBlocks = length;

            Log.info('Accountant Tree Saved Successfully ' + length, Log.LOG_TYPE.SAVING_MANAGER);

        } catch (exception){

            Log.error('Accountant Tree Saving raised an error ', Log.LOG_TYPE.SAVING_MANAGER, exception);

        }

        global.MINIBLOCKCHAIN_ADVANCED_SAVED = true;

    }

    async saveBlockchainTerminated(){

        await MiniBlockchain.prototype.saveBlockchainTerminated.call(this);

        if (process.env.BROWSER)
            return true;

        if (this.blocks.length === 0) return false;


        let answer = false;

        try {

            await this.saveAccountantTree();

            Log.info('Saving Ended', Log.LOG_TYPE.SAVING_MANAGER);

            answer = true;
        } catch (exception){
            Log.error("Couldn't save MiniBlockchain", Log.LOG_TYPE.SAVING_MANAGER, exception);

        }

        return answer;

    }


}

export default MiniBlockchainAdvanced
