import consts from "consts/const_global";
import PPoWBlockchain from 'common/blockchain/ppow-blockchain/blockchain/PPoW-Blockchain'
import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import MiniBlockchainBlock from '../blocks/Mini-Blockchain-Block'
import MiniBlockchainBlockData from '../blocks/Mini-Blockchain-Block-Data'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import MiniBlockchainTransactions from "../transactions/Mini-Blockchain-Transactions"
import RevertActions from "common/utils/Revert-Actions/Revert-Actions"
import global from "consts/global"

let inheritBlockchain;

if (consts.POPOW_PARAMS.ACTIVATED)
    inheritBlockchain = PPoWBlockchain;
else
    inheritBlockchain = InterfaceBlockchain;


class MiniBlockchain extends  inheritBlockchain{

    constructor (agent){

        super(agent);

        this.accountantTree = new MiniBlockchainAccountantTree(this.db);

        this.inheritBlockchain = inheritBlockchain;
    }

    _createBlockchainElements(){
        this.transactions = new MiniBlockchainTransactions(this);
        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.db, MiniBlockchainBlock, MiniBlockchainBlockData );
    }

    async simulateNewBlock(block, revertAutomatically, revertActions, callback, showUpdate = true ){

        revertActions.push( { name: "breakpoint" } );

        let revertException = false;

        try{


            if (block.blockValidation.blockValidationType['skip-mini-blockchain-simulation'] !== true) {

                //updating reward
                let result = this.accountantTree.updateAccount( block.data.minerAddress, block.reward, undefined, revertActions, showUpdate);

                //reward
                if ( !result ) throw {message: "reward couldn't be set to the minerAddress"};

                if (await block.data.transactions.validateTransactions(block.height, block.blockValidation.blockValidationType) === false)
                    throw {message: "Validate Transactions is wrong"};

                if (!block.blockValidation.blockValidationType['skip-sleep']) await this.sleep(2);

                if (block.blockValidation.blockValidationType['skip-validation-transactions-from-values'] !== true) {

                    block.blockValidation.blockValidationType['skip-validation-transactions-from-values'] = true;
                    revertActions.push( { name: "revert-skip-validation-transactions-from-values", block:block, value: true} );

                }

                if (!block.data.transactions.processBlockDataTransactions( block, + 1, revertActions, showUpdate ))
                    throw {message: "Process Block Data Transactions failed"};

                if (!block.blockValidation.blockValidationType['skip-sleep']) await this.sleep(2);

            }

            let callbackDone = await callback();

            if (!block.blockValidation.blockValidationType['skip-sleep']) await this.sleep(2);

            if (callbackDone === false)
                throw {message: "couldn't process the InterfaceBlockchain.prototype.includeBlockchainBlock"};

        } catch (ex){
            revertException = true;
            console.error("MiniBlockchain simulateNewBlock 1 raised an exception at blockHeight", block.height, ex, block ? block.toJSON() : '' );
        }

        try{

            //revert back the database
            if (revertException || revertAutomatically){

                revertActions.revertOperations();

                if (revertException)
                    return false;

            }


        } catch (exception){

            console.log("MiniBlockchain Reverting Error raised an exception", exception);
            revertActions.clearUntilBreakpoint();

            return false;
        }

        revertActions.clearUntilBreakpoint();

        return true;

    }

    /**
     * operate the mini-blockchain accountant tree
     * mini-blockchain, will update reward and take in consideration all transactions
     * @param block
     * @param resetMining
     * @param socketsAvoidBroadcast
     * @returns {Promise.<*>}
     */
    async includeBlockchainBlock( ...args ){

        let myArgs = args;

        if (await this.simulateNewBlock( args[0], false, args[4],

                async ()=>{
                    return await inheritBlockchain.prototype.includeBlockchainBlock.apply( this, myArgs );
                }

            , args[5] )===false) throw {message: "Error includeBlockchainBlock MiniBlockchain "};

        return true;
    }



    getBalances(address){
        return this.accountantTree.getBalances(address);
    }




    /**
     * Load blocks and check the Accountant Tree
     * @returns boolean
     */
    async _loadBlockchain(){

        if (process.env.BROWSER)
            return true;

        try {

            let result;


            result = await inheritBlockchain.prototype._loadBlockchain.call( this  );

            if ( result === false )
                throw {message: "Problem loading the blockchain"};

            //check the accountant Tree if matches
            console.log("this.accountantTree final", this.accountantTree.root.hash.sha256);

            //TODO verify accountantTree

            return result;

        } catch (exception){

            console.error("Couldn't load  MiniBlockchain", exception);
            return false;
        }

    }




}

export default MiniBlockchain