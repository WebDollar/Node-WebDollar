import Serialization from "common/utils/Serialization";
const colors = require('colors/safe');
import MiniBlockchain from "./Mini-Blockchain"
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'

class MiniBlockchainLight extends  MiniBlockchain{

    constructor (agent) {

        super(agent);

        this.lightAccountantTreeSerializations = [];

        this.lightPrevDifficultyTarget = null;
        this.lightPrevTimestamp = null;
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
                return await this.inheritBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, socketsAvoidBroadcast, saveBlock, blockValidationType );
            });

            console.log("this.blocks.height",block.height);
            console.log("this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2", this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2);

            console.log("reeesult", result, saveBlock);

            if (result && saveBlock){

                console.log("this.getSerializedAccountantTree( this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS -2 )", this.getSerializedAccountantTree( ));
                result &= await this.accountantTree.saveMiniAccountant( true, undefined, this.getSerializedAccountantTree( ));

                result &= this._recalculateLightPrevs();

            }

            this._addTreeSerialization(block.height);

            console.log("BLOCK ", block.serializeBlock().toString("hex"), " difficulty", block.difficultyTarget.toString("hex"), " prev difficulty ", block.difficultyTargetPrev.toString("hex"));

        } else {

            result = await this.inheritBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, socketsAvoidBroadcast, saveBlock, blockValidationType );

            //for debugging only

        }

        console.log("blockchain serialization2222", this.accountantTree.root.hash.sha256.toString("hex"));

        return result;

    }

    async _recalculateLightPrevs(){

        if (this.agent.light === false) return;

        let diffIndex = this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2;

        if (diffIndex === -1) {
            this.lightPrevDifficultyTarget = BlockchainGenesis.difficultyTarget;
            this.lightPrevTimestamp =  BlockchainGenesis.timeStamp ;
        }
        else if (diffIndex >= 0) {
            this.lightPrevDifficultyTarget = this.blocks[diffIndex].difficultyTarget;
            this.lightPrevTimestamp =  this.blocks[diffIndex].timestamp;
        }

        await this._saveLightSettings();

    }

    async _saveLightSettings(){
        console.log("_LightPrevDifficultyTarget saved" );

        if (! await this.db.save(this.blockchainFileName+"_LightSettings_prevDifficultyTarget", this.lightPrevDifficultyTarget) ) throw "Couldn't be saved _LightSettings_prevDifficultyTarget";
        if (! await this.db.save(this.blockchainFileName+"_LightSettings_prevTimestamp", this.lightPrevTimestamp) ) throw "Couldn't be saved _LightSettings_prevTimestamp ";
    }

    async _loadLightSettings(serializationAccountantTreeInitial){
        console.log("_LightPrevDifficultyTarget load" );

        let numBlocks = await this.db.get(this.blockchainFileName);
        if (numBlocks === null ) {
            console.log(colors.red("numBlocks was not found"));
            return false;
        }

        if (numBlocks > consts.POW_PARAMS.VALIDATE_LAST_BLOCKS) {
            this.lightPrevDifficultyTarget = await this.db.get(this.blockchainFileName + "_LightSettings_prevDifficultyTarget");
            if (this.lightPrevDifficultyTarget === null) {
                console.log(colors.red("_LightSettings_prevDifficultyTarget was not found"));
                return false;
            }

            this.lightPrevTimestamp = await this.db.get(this.blockchainFileName + "_LightSettings_prevTimestamp");
            if (this.lightPrevTimestamp === null) {
                console.log(colors.red("_LightSettings_prevTimestamp was not found"));
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


    async save(){

        try {
            console.log("saaaave", this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS -2);

            if (this.blocks.length === 0) return false;

            //AccountantTree[:-POW_PARAMS.VALIDATE_LAST_BLOCKS]
            if (! await this.accountantTree.saveMiniAccountant( true, undefined, this.getSerializedAccountantTree( ))) throw "Couldn't save the Account Tree"

            await this._saveLightSettings();

            if (! await this.inheritBlockchain.prototype.save.call(this)) throw "couldn't sae the blockchain"

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
            await this._loadLightSettings(serializationAccountantTreeInitial);

            result = result && await this.inheritBlockchain.prototype.load.call(this, consts.POW_PARAMS.VALIDATE_LAST_BLOCKS  );

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

        if (Buffer.isBuffer(this.lightAccountantTreeSerializations[height]))
            return this.lightAccountantTreeSerializations[height];

        // else I need to compute it, by removing n-1..n
        throw "not computed "+height;

    }


    _addTreeSerialization(height, serialization){

        if (height === undefined) height = this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 1;

        if (serialization === undefined){
            serialization = this.accountantTree.serializeMiniAccountant();
            console.log("serializationAccountantTree", height, "   ", serialization.toString("hex"));
        }

        this.lightAccountantTreeSerializations[height] = serialization;

        //delete serializations older than [:-m]
        // this is not working
        // if (this.lightAccountantTreeSerializations[height-2] !== undefined)
        //     this.lightAccountantTreeSerializations.splice(height-2, 1);

        // updating the blocksStartingPoint
        if (this.agent.light === true) {
            this.blocksStartingPoint = this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 1;
            console.log("this.blocksStartingPoint",this.blocksStartingPoint);
            console.log("this.blocksStartingPoint",this.blocksStartingPoint);
        }

    }


    getDifficultyTarget(height){

        if (this.agent.light === true) {

            if (height === this.blocksStartingPoint - 1 ) {
                return this.lightPrevDifficultyTarget;
            } else
            if (height < this.blocksStartingPoint -1 ) return null;
        }

        return MiniBlockchain.prototype.getDifficultyTarget.call(this, height);
    }

    getTimestamp(height){

        if (this.agent.light === true) {

            if (height === this.blocksStartingPoint - 1 ) {
                return this.lightPrevTimestamp;
            } else
            if (height < this.blocksStartingPoint -1 ) return null;
        }

        return MiniBlockchain.prototype.getTimestamp.call(this, height);
    }


}

export default MiniBlockchainLight;