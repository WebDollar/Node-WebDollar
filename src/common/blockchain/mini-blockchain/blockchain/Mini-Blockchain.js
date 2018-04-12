import consts from "consts/const_global";
import PPoWBlockchain from 'common/blockchain/ppow-blockchain/blockchain/PPoW-Blockchain'
import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import MiniBlockchainBlock from '../blocks/Mini-Blockchain-Block'
import MiniBlockchainBlockData from '../blocks/Mini-Blockchain-Block-Data'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import MiniBlockchainTransactions from "../transactions/Mini-Blockchain-Transactions"
import RevertActions from "common/utils/Revert-Actions/Revert-Actions"

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

    async simulateNewBlock(block, revertAutomatically, revertActions, callback){

        if (revertActions === undefined)
            revertActions = new RevertActions(this);

        revertActions.push( { name: "breakpoint" } );

        let revertException = false;

        try{

            //updating reward
            let result = this.accountantTree.updateAccount( block.data.minerAddress, block.reward, undefined, revertActions );

            //reward
            if (result === null || result === undefined)
                throw {message: "reward couldn't be set to the minerAddress"};

            if (!block.data.transactions.validateTransactions(block.height, block.blockValidation.blockValidationType))
                throw {message: "Validate Transactions is wrong"};


            if (block.blockValidation.blockValidationType['skip-validation-transactions-from-values'] !== true) {

                block.blockValidation.blockValidationType['skip-validation-transactions-from-values'] = true;
                revertActions.push( { name: "revert-skip-validation-transactions-from-values", block:block, value: true} );
            }

            if (!block.data.transactions.processBlockDataTransactions( block, + 1, revertActions ))
                throw {message: "Process Block Data Transactions failed"};

            let callbackDone = await callback();

            if (callbackDone === false)
                throw {message: "couldn't process the InterfaceBlockchain.prototype.includeBlockchainBlock"};

        } catch (ex){
            revertException = true;
            console.error("MiniBlockchain simulateNewBlock 1 raised an exception", ex);
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
            return false;

        }

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
    async includeBlockchainBlock( block, resetMining, socketsAvoidBroadcast, saveBlock, revertActions ){

        if (await this.simulateNewBlock(block, false, revertActions,

                async ()=>{
                    return await inheritBlockchain.prototype.includeBlockchainBlock.call( this, block, resetMining, socketsAvoidBroadcast, saveBlock, revertActions );
                }

            )===false) throw {message: "Error includeBlockchainBlock MiniBlockchain "};

        return true;
    }


    async _onBlockCreated(block, saveBlock){

        await inheritBlockchain.prototype._onBlockCreated.call(this, block, saveBlock);

        if (saveBlock)
            if ( ! (await this.accountantTree.saveMiniAccountant(true)))
                console.error("Error Saving Mini Accountant Tree");
    }

    getBalances(address){
        return this.accountantTree.getBalances(address);
    }


    async saveBlockchain( startingHeight, endingHeight ){

        if (process.env.BROWSER)
            return true;

        try {

            if (this.blocks.length === 0)
                return false;

            if (! (await this.accountantTree.saveMiniAccountant( true )))
                throw {message: "Couldn't save the Account Tree"};

            if (! (await inheritBlockchain.prototype.saveBlockchain.call(this, startingHeight, endingHeight)))
                throw {message: "couldn't sae the blockchain"};

            return true;

        } catch (exception){
            console.error("Couldn't save MiniBlockchain", exception);
            return false;
        }
    }

    /**
     * Load blocks and check the Accountant Tree
     * @returns boolean
     */
    async loadBlockchain(){

        if (process.env.BROWSER)
            return true;

        try {

            let finalAccountantTree = new MiniBlockchainAccountantTree(this.db);
            let result = await finalAccountantTree.loadMiniAccountant(undefined, undefined, true);
            //let serializationAccountantTreeFinal = this.accountantTree.serializeMiniAccountant();

            result = result && await inheritBlockchain.prototype.loadBlockchain.call( this  );

            if ( result === false )
                throw {message: "Problem loading the blockchain"};

            //check the accountant Tree if matches
            console.log("this.accountantTree final", this.accountantTree.root.hash.sha256);
            console.log("finalAccountantTree final", finalAccountantTree.root.hash.sha256);

            if (this.accountantTree.root.hash.sha256.compare(finalAccountantTree.root.hash.sha256) !== 0){
                throw {message: "Accountant Trees are different"};
            }

            return result;

        } catch (exception){

            console.error("Couldn't load  MiniBlockchain", exception);
            return false;
        }

    }




}

export default MiniBlockchain