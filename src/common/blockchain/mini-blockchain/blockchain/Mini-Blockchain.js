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
        this.accountantTreeSerializations = [];
        this.lightPrevDifficultyTarget = null;

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
            console.log(colors.green("block.data.minerAddress"),block.data.minerAddress, colors.yellow(block.reward));

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

        let  result;

        console.log("blockchain serialization1", this.accountantTree.root.hash.sha256.toString("hex"));

        if (  blockValidationType['skip-validation-before'] === undefined ||
            (block.height >= blockValidationType['skip-validation-before'].height )) {

            console.log("block.height > ", block.height);

            result = await this.simulateNewBlock(block, false, async ()=>{
                return await inheritBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, socketsAvoidBroadcast, saveBlock, blockValidationType );
            });

            console.log("this.blocks.height",block.height)
            console.log("this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2", this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2)

            console.log("reeesult", result, saveBlock);

            if (result && saveBlock){

                console.log("this.getSerializedAccountantTree( this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS -2 )", this.getSerializedAccountantTree( ));
                result = await this.accountantTree.saveMiniAccountant( true, undefined, this.getSerializedAccountantTree( ));

                if (this.agent.light === true) {

                    let diffIndex = this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2;
                    if (diffIndex === -1)
                        this._setLightPrevDifficultyTarget(BlockchainGenesis.difficultyTarget)
                    else if (diffIndex >= 0)
                        this._setLightPrevDifficultyTarget( this.blocks[ diffIndex ].difficultyTarget );

                    console.log("_LightPrevDifficultyTarget saved" );
                    if (! await this.db.save(this.blockchainFileName+"_LightPrevDifficultyTarget", this.lightPrevDifficultyTarget) ) throw "Couldn't be saved lightPrevDifficultyTarget ";
                }

            }

            this._addTreeSerialization(block.height);

        } else {

            result = await inheritBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, socketsAvoidBroadcast, saveBlock, blockValidationType );

            //for debugging only

        }

        console.log("blockchain serialization2222", this.accountantTree.root.hash.sha256.toString("hex"));

        return result;

    }

    getBalances(address){

        return this.accountantTree.getBalances(address);

    }


    async save(){

        try {
            console.log("saaaave", this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS -2);

            if (this.blocks.length === 0) return false;

            //AccountantTree[:-POW_PARAMS.VALIDATE_LAST_BLOCKS]
            if (! await this.accountantTree.saveMiniAccountant( true, undefined, this.getSerializedAccountantTree( ))) throw "Couldn't save the Account Tree"

            if (this.agent.light === true)
                if (! await this.db.save(this.blockchainFileName+"_LightPrevDifficultyTarget", this.lightPrevDifficultyTarget) ) throw "Couldn't be saved lightPrevDifficultyTarget ";

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

            //AccountantTree[:-POW_PARAMS.VALIDATE_LAST_BLOCKS]
            let result = await this.accountantTree.loadMiniAccountant(undefined, undefined, true);
            let serializationAccountantTreeInitial = this.accountantTree.serializeMiniAccountant();

            //check the accountant Tree if matches
            console.log("this.accountantTree initial ", this.accountantTree.root.hash.sha256);


            //load the number of blocks
            if (this.agent.light === true) {

                let numBlocks = await this.db.get(this.blockchainFileName);
                if (numBlocks === null ) {
                    console.log(colors.red("numBlocks was not found"));
                    return false;
                }

                if (numBlocks > consts.POW_PARAMS.VALIDATE_LAST_BLOCKS) {
                    this.lightPrevDifficultyTarget = await this.db.get(this.blockchainFileName + "_LightPrevDifficultyTarget");
                    if (this.lightPrevDifficultyTarget === null) {
                        console.log(colors.red("lightPrevDifficultyTarget was not found"));
                        return false;
                    }
                }

                this._addTreeSerialization(numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2, serializationAccountantTreeInitial);
                console.log("numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2", numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2, serializationAccountantTreeInitial.toString("hex"))
                console.log("numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2", numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2, serializationAccountantTreeInitial.toString("hex"))
                console.log("numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2", numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2, serializationAccountantTreeInitial.toString("hex"))
                console.log("numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2", numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2, serializationAccountantTreeInitial.toString("hex"))
                console.log("numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2", numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2, serializationAccountantTreeInitial.toString("hex"))
                console.log("numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2", numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2, serializationAccountantTreeInitial.toString("hex"))
                console.log("numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2", numBlocks - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2, serializationAccountantTreeInitial.toString("hex"))
                if (this.accountantTree.root.edges.length > 0) {
                    console.log("balances", this.accountantTree.root.edges[0].targetNode.balances)
                    console.log("balances", this.accountantTree.root.edges[0].targetNode.balances)
                    console.log("balances", this.accountantTree.root.edges[0].targetNode.balances)
                    console.log("balances", this.accountantTree.root.edges[0].targetNode.balances)
                }

            }

            result = result && await inheritBlockchain.prototype.load.call(this, consts.POW_PARAMS.VALIDATE_LAST_BLOCKS  );

            if (result === false){
                throw "Problem loading the blockchain";
            }

            //check the accountant Tree if matches
            console.log("this.accountantTree final", this.accountantTree.root.hash.sha256);

            return result;

        } catch (exception){

            console.log(colors.red("Couldn't load MiniBlockchain"), exception);
            this.accountantTree = new MiniBlockchainAccountantTree(this.db);
            return false;
        }
    }


    getSerializedAccountantTree(height){

        if (height === undefined) height = this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2;

        if (height < 0)
            height = -1;

        if (height === -1){
            let emptyAccountantTree = new MiniBlockchainAccountantTree(this.db);
            return emptyAccountantTree.serializeMiniAccountant();
        }

        if (Buffer.isBuffer(this.accountantTreeSerializations[height]))
            return this.accountantTreeSerializations[height];

        console.log(JSON.stringify(this.accountantTreeSerializations));

        // else I need to compute it, by removing n-1..n
        throw "not computed "+height;

    }

    _addTreeSerialization(height, serialization){

        if (height === undefined) height = this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 1;

        if (serialization === undefined){
            serialization = this.accountantTree.serializeMiniAccountant();
            console.log("serializationAccountantTree", height, "   ", serialization.toString("hex"));
        }

        this.accountantTreeSerializations[height] = serialization;

        //delete serializations older than [:-m]
        // this is not working
        // if (this.accountantTreeSerializations[height-2] !== undefined)
        //     this.accountantTreeSerializations.splice(height-2, 1);

        // updating the blocksStartingPoint
        if (this.agent.light === true)
            this.blocksStartingPoint = this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS-1;

    }

    _setLightPrevDifficultyTarget(newLightPrevDifficultyTarget ){
        this.lightPrevDifficultyTarget = newLightPrevDifficultyTarget;
    }

    getDifficultyTarget(height){

        // updating the blocksStartingPoint
        if (this.agent.light === true) {

            if (height === this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2 ) {
                return this.lightPrevDifficultyTarget;
            } else
            if (height < this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2 ) return null;
        }

        return inheritBlockchain.prototype.getDifficultyTarget.call(this, height);

    }

}

export default MiniBlockchain