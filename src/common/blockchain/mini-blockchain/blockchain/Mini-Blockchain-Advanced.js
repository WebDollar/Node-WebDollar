import consts from "consts/const_global";
import MiniBlockchain from "./Mini-Blockchain";
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import global from "consts/global"
import Log from 'common/utils/logging/Log';
import GZip from "common/utils/GZip";
import MiniBlockchainAdvancedGZipManager from "./Mini-Blockchain-Advanced-GZip-Manager"
import Blockchain from "../../../../main-blockchain/Blockchain";

class MiniBlockchainAdvanced extends  MiniBlockchain{

    constructor (agent){

        super(agent);

        this.lightAccountantTreeSerializations = {};
        this.lightAccountantTreeSerializationsGzipped = {};

        this.lightGZipManager = new MiniBlockchainAdvancedGZipManager(this);

    }


    async _onBlockCreated(block, saveBlock){

        await MiniBlockchain.prototype._onBlockCreated.call(this, block, saveBlock);

        if ( ! block.blockValidation.blockValidationType["skip-saving-light-accountant-tree-serializations"] ){

            // let serialization = this.accountantTree.serializeMiniAccountant();
            //
            // this.lightAccountantTreeSerializations[block.height+1] = serialization;
            // this.lightAccountantTreeSerializationsGzipped[block.height+1] = undefined;

            //gzip is being calculated later on

            //delete old lightAccountantTreeSerializations

            // let index = this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES_TO_DELETE - 2;
            //
            // while (this.lightAccountantTreeSerializations[index] !== undefined){
            //     delete this.lightAccountantTreeSerializations[index];
            //     delete this.lightAccountantTreeSerializationsGzipped[index];
            //     index--;
            // }

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

            if (gzipped)
                return this.lightAccountantTreeSerializationsGzipped[height];
            else
                return this.lightAccountantTreeSerializations[height];

        }

        // else I need to compute it, by removing n-1..n
        throw {message: "not computed ", height:height};

    }

    async _loadBlockchainPrevious(){

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

    }

    async _loadBlockchain(){

        if (process.env.BROWSER)
            return true;

        try {

            if (process.env.FORCE_LOAD !== undefined) throw "load blockchain simple" ;

            let length = await this.db.get("lightAccountantTreeFinalAdvanced_blockLength");

            if (length === null)
                await this._loadBlockchainPrevious();
            else {

                if (!(await this.accountantTree.loadMiniAccountant(undefined, undefined, false,  "lightAccountantTreeFinalAdvanced")))
                    throw "load blockchain simple";

                this.accountantTree.root._calculateHashTree();

                console.info("accountant tree loaded 1", this.accountantTree.root.hash.sha256.toString("hex"));

                let answer = await this.inheritBlockchain.prototype._loadBlockchain.call(this, undefined, 0, length);

                console.info("accountant tree loaded 2", this.accountantTree.root.hash.sha256.toString("hex"));
                console.info("accountant tree", this.accountantTree.root.edges.length);

                if (!answer) {
                    //couldn't load the last K blocks

                    Log.error("Couldn't load accountan tree", Log.LOG_TYPE.SAVING_MANAGER);

                    await this.accountantTree.loadMiniAccountant(new Buffer(0));

                    throw "load blockchain simple"; //let's force to load a simple blockchain
                }

            }

        } catch (exception){

            Log.error("Loading Blockchain Exception Couldn't load the last K blocks", Log.LOG_TYPE.SAVING_MANAGER, exception);

            if (exception === "load blockchain simple") {

                await this.inheritBlockchain.prototype._loadBlockchain.call(this);

            }
        }

        this._miniBlockchainSaveBlocks = this.blocks.length;

        if (consts.BLOCKCHAIN.LIGHT.GZIPPED)
            await this.lightGZipManager.processAllAccountantTrees();

        return false;

    }

    async saveAccountantTree(serialization, length){

        global.MINIBLOCKCHAIN_ADVANCED_SAVED = false;

        try {

            if (length === undefined) length = this.blocks.length;

            if (length === 0) throw {message: "length is 0"};

            //avoid resaving the same blockchain
            if (this._miniBlockchainSaveBlocks >= length) throw {message: "already saved"};

            Log.info('Accountant Tree Saving ', Log.LOG_TYPE.SAVING_MANAGER);

            if (await this.db.save(this._blockchainFileName, length) !== true)
                throw {message: "Error saving the blocks.length"};

            if (length < consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES) throw {message: "Couldn't save blockchain"};

            if (!(await this.db.save("lightAccountantTreeFinalAdvanced_blockLength", length )))
                throw { message: "Couldn't be saved _lightAccountantTreeAdvanced_offset",  index: this._blockchainFileName  };

            await this.sleep(70);

            console.info("accountant tree", this.accountantTree.root.hash.sha256.toString("hex"));
            console.info("accountant tree", this.accountantTree.root.edges.length);

            if (!(await this.accountantTree.saveMiniAccountant(true, "lightAccountantTreeFinalAdvanced", serialization)))
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

        Log.info('Saving Accountant Tree', Log.LOG_TYPE.SAVING_MANAGER);

        if (!this.agent.consensus)
            return false;

        await MiniBlockchain.prototype.saveBlockchainTerminated.call(this);

        if (process.env.BROWSER)
            return true;

        if (this.blocks.length === 0) return false;


        let answer = false;

        try {

            Log.info('Saving Accountant Tree', Log.LOG_TYPE.SAVING_MANAGER);

            await this.saveAccountantTree(this.accountantTree.serializeMiniAccountant(false), this.blocks.length );

            Log.info('Saving Ended', Log.LOG_TYPE.SAVING_MANAGER);

            answer = true;
        } catch (exception){
            Log.error("Couldn't save MiniBlockchain", Log.LOG_TYPE.SAVING_MANAGER, exception);

        }

        return answer;

    }


}

export default MiniBlockchainAdvanced
