import consts from "consts/const_global";
import MiniBlockchain from "./Mini-Blockchain";
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import global from "consts/global"
import Log from 'common/utils/logging/Log';

class MiniBlockchainAdvanced extends  MiniBlockchain{

    constructor (agent){

        super(agent);

        this._miniBlockchainSaveBlocks = 0;
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

        // else I need to compute it, by removing n-1..n
        throw {message: "not computed ", height:height};

    }

    async _loadBlockchain(){

        if (process.env.BROWSER)
            return true;

        try {

            if (process.env.FORCE_LOAD !== undefined) throw "load blockchain simple" ;

            if ( await this.prover.provesCalculated._loadProvesCalculated() === false )
                throw "load blockchain simple";

            if ( await this.accountantTree.loadMiniAccountant( undefined, 0, true, "accountantTree") === false )
                throw "load blockchain simple";

            if ( await this.blocks.readBlockchainLength() === false)
                throw "load blockchain simple";

            Log.info("============================================================================" , Log.LOG_TYPE.SAVING_MANAGER);
            Log.info("============================================================================" , Log.LOG_TYPE.SAVING_MANAGER);
            Log.info("                              Blockchain Virtualized " + this.blocks.length, Log.LOG_TYPE.SAVING_MANAGER);
            Log.info("============================================================================" , Log.LOG_TYPE.SAVING_MANAGER);
            Log.info("============================================================================" , Log.LOG_TYPE.SAVING_MANAGER);

            //to continue slow loading uncomment the following command
            //await this.inheritBlockchain.prototype._loadBlockchain.call(this, this.blocks.length, 	595000);

        } catch (exception){

            //let's force to load a simple blockchain

            this.accountantTree.clear();

            Log.error("Virtualzied Blockchain couldn't be loaded", Log.LOG_TYPE.SAVING_MANAGER, exception);

            if (exception === "load blockchain simple")
                await this.inheritBlockchain.prototype._loadBlockchain.call(this);
        }

        this._miniBlockchainSaveBlocks = this.blocks.length;

        return true;

    }

    async saveMiniBlockchain(setSemaphore = true){

        if (setSemaphore)
            global.MINIBLOCKCHAIN_ADVANCED_SAVED = false;

        try {

            if (await this.semaphoreProcessing.processSempahoreCallback(async () => {

                let length = this.blocks.length;
                let serialization = this.accountantTree.serializeMiniAccountant(true, );

                //avoid re saving the same blockchain
                if (this._miniBlockchainSaveBlocks >= length) return false;

                Log.info('Accountant Tree Saving ', Log.LOG_TYPE.SAVING_MANAGER);

                console.info("accountant tree", this.accountantTree.root.hash.toString("hex"));
                console.info("accountant tree", this.accountantTree.root.edges.length);

                if (!(await this.accountantTree.saveMiniAccountant(true, "accountantTree", serialization)))
                    throw {message: "saveMiniAccountant couldn't be saved"};

                if ( !(await this.blocks.saveBlockchainLength(length)) )
                    throw {message: "save blockchain length couldn't be saved"};

                if ( !(await this.prover.provesCalculated._saveProvesCalculated()) )
                    throw { message: "save proves calculated couldn't be saved" };

                this._miniBlockchainSaveBlocks = length;

                return true;

            }) === false) throw {message: "Saving was not done"};


            Log.info('Accountant Tree Saved Successfully ' + this.blocks.length, Log.LOG_TYPE.SAVING_MANAGER);

        } catch (exception){

            Log.error('Accountant Tree Saving raised an error ', Log.LOG_TYPE.SAVING_MANAGER, exception);

        }

        if (setSemaphore)
            global.MINIBLOCKCHAIN_ADVANCED_SAVED = true;

    }

}

export default MiniBlockchainAdvanced
