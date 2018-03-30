import consts from "consts/const_global";
import PPoWBlockchain from 'common/blockchain/ppow-blockchain/blockchain/PPoW-Blockchain'
import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import MiniBlockchainBlock from '../blocks/Mini-Blockchain-Block'
import MiniBlockchainBlockData from '../blocks/Mini-Blockchain-Block-Data'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import MiniBlockchainTransactions from "../transactions/Mini-Blockchain-Transactions"

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

    async simulateNewBlock(block, revertAutomatically, callback){

        let revert = {
            revertNow: false,
            reward: false,
            transactions:{
                start: 0,
                end: -1,
            }
        };

        let exception = null;

        let result;

        try{

            //updating reward

            result = this.accountantTree.updateAccount( block.data.minerAddress, block.reward, undefined )

            // let balances = this.accountantTree.listBalances( block.data.minerAddress );
            // console.log("balances", balances );

            //reward
            if (result === null || result === undefined)
                throw {message: "reward couldn't be set to the minerAddress"};


            revert.reward = true;
            //validate transactions & tree
            revert.transactions.start = 0;

            if (!block.data.transactions.validateTransactions(block.height, block.blockValidationType))
                throw {message: "Validate Transactions is wrong"};


            block.blockValidation.blockValidationType['skip-validation-transactions-from-values'] = true;
            revert.transactions.end = block.data.transactions.processBlockDataTransactions(block, 1);

            //inheriting blockchain includeBlockchainBlock
            result = await callback();

            if (result === false)
                throw {message: "couldn't process the InterfaceBlockchain.prototype.includeBlockchainBlock"};


        } catch (ex){

            exception = ex;
            revert.revertNow = true;

            console.error("MiniBlockchain simulateNewBlock 1 raised an exception", ex);

        }

        try{

            //revert back the database
            console.log("reverting", revert.revertNow, revertAutomatically)

            if (revert.revertNow || revertAutomatically){

                //revert transactions
                block.data.transactions.processBlockDataTransactionsRevert(revert.transactions.end, revert.transactions.start, block, - 1);
                block.blockValidation.blockValidationType['skip-validation-transactions-from-values'] = undefined;

                //revert reward
                if (revert.reward)
                    this.accountantTree.updateAccount( block.data.minerAddress, block.reward.negated(), undefined );

                if (revert.revertNow)
                    return false;
            }


        } catch (exception){

            console.log("MiniBlockchain simulateNewBlock 2 raised an exception", exception);
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
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast, saveBlock){

        if (await this.simulateNewBlock(block, false, async ()=>{
            return await inheritBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, socketsAvoidBroadcast, saveBlock );
        })===false) throw {message: "Error includeBlockchainBlock MiniBlockchain "};

        if (! (await this.accountantTree.saveMiniAccountant(true)))
            console.error("Error Saving Mini Accountant Tree");

        return true;
    }

    getBalances(address){
        return this.accountantTree.getBalances(address);
    }


    async saveBlockchain(){

        if (process.env.BROWSER)
            return true;

        try {

            if (this.blocks.length === 0)
                return false;

            if (! (await this.accountantTree.saveMiniAccountant( true )))
                throw {message: "Couldn't save the Account Tree"}

            if (! (await inheritBlockchain.prototype.saveBlockchain.call(this)))
                throw {message: "couldn't sae the blockchain"}

            return true;

        } catch (exception){
            console.error("Couldn't save MiniBlockchain", exception)
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

            if (result === false){
                throw {message: "Problem loading the blockchain"};
            }

            //check the accountant Tree if matches
            console.log("this.accountantTree final", this.accountantTree.root.hash.sha256);
            console.log("finalAccountantTree final", finalAccountantTree.root.hash.sha256);

            if (this.accountantTree.root.hash.sha256.compare(finalAccountantTree.root.hash.sha256) !== 0){
                throw {message: "Accountant Trees are different"};
            }

            return result;

        } catch (exception){

            console.error("Couldn't load  MiniBlockchain", exception);
            this.accountantTree = new MiniBlockchainAccountantTree(this.db);
            return false;
        }

    }


}

export default MiniBlockchain