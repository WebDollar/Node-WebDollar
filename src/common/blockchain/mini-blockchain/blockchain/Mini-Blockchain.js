
import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import MiniBlockchainBlock from '../blocks/Mini-Blockchain-Block'
import MiniBlockchainBlockData from '../blocks/Mini-Blockchain-Block-Data'
import MiniBlockchainFork from './forks/Mini-Blockchain-Fork'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import InterfaceBlockchainForksAdministrator from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Forks-Administrator'

class MiniBlockchain extends  InterfaceBlockchain{

    constructor (){

        super();

        this.accountantTree = new MiniBlockchainAccountantTree();
        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.dataBase, MiniBlockchainBlock, MiniBlockchainBlockData)
        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this, MiniBlockchainFork );
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

        let result = true;

        try{

            //updating reward
            console.log("block.data.minerAddress", block.data.minerAddress)
            result = !this.accountantTree.updateAccount( block.data.minerAddress, block.reward, undefined )

            // let balances = this.accountantTree.listBalances( block.data.minerAddress );
            // console.log("balances", balances );

            //reward
            if (result !== null && result !== undefined)
                revert.reward = true;
            else
                throw "reward couldn't be set to the minerAddress"


            //validate transactions & tree
            revert.transactions.start = 0;
            for (let i=0; i<block.data.transactions.length; i++) {
                //TO DO
                if (1===1){
                    revert.transactions.end = i;
                } else
                    throw "couldn't process the transaction "+i;
            }

            //inheriting blockchain includeBlockchainBlock
            result = await callback();

            if (result === false)
                throw "couldn't process the InterfaceBlockchain.prototype.includeBlockchainBlock";


        } catch (ex){

            exception = ex;
            revert.revertNow = true;

        }

        //revert back the database
        if (revert.revertNow || revertAutomatically){

            //revert transactions
            for (let i=revert.transactions.end; i>= revert.transactions.start; i--) {
                // TO DO
            }

            //revert reward
            if (revert.reward)
                this.accountantTree.updateAccount( block.data.minerAddress, block.reward.negated(), undefined );

            if (exception !== null) {
                console.log("exception simulateNewBlock ", exception);
                throw exception;
            }

            return false;
        }

        return result;

    }

    /**
     * operate the mini-blockchain accountant tree
     * mini-blockchain, will update reward and take in consideration all transactions
     * @param block
     * @param resetMining
     * @param socketsAvoidBroadcast
     * @returns {Promise.<*>}
     */
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast){

        return await this.simulateNewBlock(block, false, async ()=>{
            return await InterfaceBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, socketsAvoidBroadcast);
        })

    }

    getBalances(address){

        return this.accountantTree.getBalances(address);

    }

}

export default MiniBlockchain