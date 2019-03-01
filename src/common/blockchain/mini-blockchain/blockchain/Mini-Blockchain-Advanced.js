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

            //
            //
            //to continue slow loading uncomment the following command
            //this will enable to index the entire blockchain
            //
            //await this.inheritBlockchain.prototype._loadBlockchain.call(this, this.blocks.length, 	622969);

            let chainHash = await this.db.get("blockChainHash"+0);

            if ( !chainHash ){
                console.error("============================================================================" );
                console.error("For Virtualized branch, you need to download a new blockchainDB3 because it is no longer compatible with your version" );
                console.error("============================================================================" );
                process.exit();
            }

            if ( this.blocks.length > 100 && await this.transactions.checkVirtualizedTxId("6a81930823e659286cfffe592172c0f054d0e2a4760d0d51770ffab440d00bfa") === null ){
                console.error("============================================================================" );
                console.error("For Transactions branch, you need to download a new blockchainDB3 because it is no longer compatible with your version" );
                console.error("============================================================================" );
                process.exit();
            }

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

    async saveMiniBlockchain(setGlobalVariable = true, useSemaphore = true){

        if (setGlobalVariable)
            global.MINIBLOCKCHAIN_ADVANCED_SAVED = false;

        try {

            let save = async () => {

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

            };

            if (useSemaphore) {
                if ( !( await this.semaphoreProcessing.processSempahoreCallback(save) )) throw {message: "Saving was not done"};
            } else
                if ( !( await save() ) ) throw {message: "Saving was not done"};

            Log.info('Accountant Tree Saved Successfully ' + this.blocks.length, Log.LOG_TYPE.SAVING_MANAGER);

        } catch (exception){

            Log.error('Accountant Tree Saving raised an error ', Log.LOG_TYPE.SAVING_MANAGER, exception);

        }

        if (setGlobalVariable)
            global.MINIBLOCKCHAIN_ADVANCED_SAVED = true;

    }

}

export default MiniBlockchainAdvanced
