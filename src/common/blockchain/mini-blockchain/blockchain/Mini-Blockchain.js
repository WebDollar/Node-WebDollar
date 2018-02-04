import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'

const colors = require('colors/safe');
import PPoWBlockchain from 'common/blockchain/ppow-blockchain/blockchain/PPoW-Blockchain'
import InterfaceBlockchain from 'common/blockchain/interface-blockchain/blockchain/Interface-Blockchain'

import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import MiniBlockchainBlock from '../blocks/Mini-Blockchain-Block'
import MiniBlockchainBlockData from '../blocks/Mini-Blockchain-Block-Data'
import MiniBlockchainFork from '../protocol/Mini-Blockchain-Fork'
import InterfaceBlockchainBlockCreator from 'common/blockchain/interface-blockchain/blocks/Interface-Blockchain-Block-Creator'
import InterfaceBlockchainForksAdministrator from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Forks-Administrator'
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'

import MiniBlockchainAgentLightNode from "./../agents/Mini-Blockchain-Agent-Light-Node"

import consts from "consts/const_global";

let inheritBlockchain;

if (consts.POPOW_ACTIVATED) inheritBlockchain = PPoWBlockchain;
else  inheritBlockchain = InterfaceBlockchain;


class MiniBlockchain extends  inheritBlockchain{

    constructor (agent){

        super(agent);

        this.accountantTree = new MiniBlockchainAccountantTree(this.db);

        this.inheritBlockchain = inheritBlockchain;

        this.blockCreator = new InterfaceBlockchainBlockCreator( this, this.db, MiniBlockchainBlock, MiniBlockchainBlockData );
        this.forksAdministrator = new InterfaceBlockchainForksAdministrator ( this, agent.forkClass );
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
            //console.log(colors.green("block.data.minerAddress"),block.data.minerAddress, colors.yellow(block.reward));

            result = !this.accountantTree.updateAccount( block.data.minerAddress, block.reward, undefined )

            // let balances = this.accountantTree.listBalances( block.data.minerAddress );
            // console.log("balances", balances );

            //reward
            if (result !== null && result !== undefined)
                revert.reward = true;
            else
                throw "reward couldn't be set to the minerAddress";


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

            console.log("MiniBlockchain simulateNewBlock 1 raised an exception", ex);

        }

        try{

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


        } catch (exception){

            console.log("MiniBlockchain simulateNewBlock 2 raised an exception", exception);
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
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast, saveBlock, blockValidationType){

        let result = await this.simulateNewBlock(block, false, async ()=>{
            return await inheritBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, socketsAvoidBroadcast, saveBlock, blockValidationType );
        });

        result &= await this.accountantTree.saveMiniAccountant( true);

        return result;
    }

    getBalances(address){
        return this.accountantTree.getBalances(address);
    }


    async save(){

        try {

            if (this.blocks.length === 0) return false;

            if (! await this.accountantTree.saveMiniAccountant( true )) throw "Couldn't save the Account Tree"

            if (! await inheritBlockchain.prototype.save.call(this)) throw "couldn't sae the blockchain"

            return true;

        } catch (exception){
            console.log(colors.red("Couldn't save MiniBlockchain"), exception)
            return false;
        }
    }

    /**
     * Load blocks and check the Accountant Tree
     * @returns boolean
     */
    async load(){

        try {

            let finalAccountantTree = new MiniBlockchainAccountantTree(this.db);
            let result = await finalAccountantTree.loadMiniAccountant(undefined, undefined, true);
            //let serializationAccountantTreeFinal = this.accountantTree.serializeMiniAccountant();

            result = result && await inheritBlockchain.prototype.load.call( this  );

            if (result === false){
                throw "Problem loading the blockchain";
            }

            //check the accountant Tree if matches
            console.log("this.accountantTree final", this.accountantTree.root.hash.sha256);
            console.log("finalAccountantTree final", finalAccountantTree.root.hash.sha256);

            if (this.accountantTree.root.hash.sha256.compare(finalAccountantTree.root.hash.sha256) !== 0){
                throw "Accountant Trees are different";
            }

            return result;

        } catch (exception){

            console.log(colors.red("Couldn't load  MiniBlockchain"), exception);
            this.accountantTree = new MiniBlockchainAccountantTree(this.db);
            return false;
        }

    }


}

export default MiniBlockchain