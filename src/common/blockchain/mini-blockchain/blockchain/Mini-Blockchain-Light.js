import Serialization from "common/utils/Serialization";
const colors = require('colors/safe');
import MiniBlockchain from "./Mini-Blockchain"
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'

/**
 * Light Nodes virtualize prevHash, prevTimestamp and prevDifficultyTarget
 */
class MiniBlockchainLight extends  MiniBlockchain{

    constructor (agent) {

        super(agent);

        this._initializeMiniBlockchainLight();
    }

    _initializeMiniBlockchainLight(){
        this.blocks = [];
        this.blocksStartingPoint = 0;
        this.lightAccountantTreeSerializations = {};
        this.lightPrevDifficultyTarget = null;
        this.lightPrevTimeStamp = null;
        this.lightPrevHashPrev = null;
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
                return await this.inheritBlockchain.prototype.includeBlockchainBlock.call( this, block, resetMining, "all", saveBlock, blockValidationType );
            });

            console.log("this.blocks.height",block.height);
            //console.log("this.blocks.length - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS - 2", this.blocks.length - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 2);

            console.log("reeesult", result, saveBlock);

            if (result && saveBlock ){

                result &= await this.accountantTree.saveMiniAccountant( true, undefined, this.getSerializedAccountantTree( this.blocks.length - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS - 2 ));
                result &= this._recalculateLightPrevs();

                // propagating a new block in the network
                this.propagateBlocks(block.height, socketsAvoidBroadcast)
            }
            this._addTreeSerialization(block.height);

            // console.log("BLOCK ", block.serializeBlock().toString("hex"));
            // console.log(" difficulty", block.difficultyTarget.toString("hex"));
            // console.log(" prev difficulty ", block.difficultyTargetPrev.toString("hex"));
            // console.log(" prev hash ", block.hashPrev.toString("hex"));

        } else {

            result = await this.inheritBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, "all", saveBlock, blockValidationType );

            //for debugging only

        }

        console.log("blockchain tree serialization", this.accountantTree.root.hash.sha256.toString("hex"));
        console.log("blockchain tree value", this.accountantTree.root.edges[0].targetNode.balances);

        return result;

    }

    async _recalculateLightPrevs(){

        if (this.agent.light === false) return;

        let diffIndex = this.blocks.length - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS - 2;

        if (diffIndex === -1) {

            this.lightPrevDifficultyTarget = BlockchainGenesis.difficultyTarget;
            this.lightPrevTimeStamp =  BlockchainGenesis.timeStamp ;
            this.lightPrevHashPrev =  BlockchainGenesis.hash ;
        }
        else if (diffIndex >= 0) {

            if (diffIndex >= this.blocks.length) throw "_recalculateLightPrevs diffIndex wrong "+diffIndex;

            this.lightPrevDifficultyTarget = this.blocks[diffIndex].difficultyTarget;
            this.lightPrevTimeStamp =  this.blocks[diffIndex].timeStamp;
            this.lightPrevHashPrev =  this.blocks[diffIndex].hash;

        }

        await this._saveLightSettings();

    }

    async _saveLightSettings(){
        console.log("_LightPrevDifficultyTarget saved" );

        if (! await this.db.save(this.blockchainFileName+"_LightSettings_prevDifficultyTarget", this.lightPrevDifficultyTarget) ) throw "Couldn't be saved _LightSettings_prevDifficultyTarget";
        if (! await this.db.save(this.blockchainFileName+"_LightSettings_prevTimestamp", this.lightPrevTimeStamp) ) throw "Couldn't be saved _LightSettings_prevTimestamp ";
        if (! await this.db.save(this.blockchainFileName+"_LightSettings_prevHashPrev", this.lightPrevHashPrev) ) throw "Couldn't be saved _LightSettings_prevHashPrev ";
    }

    async _loadLightSettings(serializationAccountantTreeInitial){

        console.log("_loadLightSettings load" );

        let numBlocks = await this.db.get(this.blockchainFileName);
        if (numBlocks === null ) {
            console.log(colors.red("numBlocks was not found"));
            return false;
        }

        if (numBlocks > consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS) {
            this.lightPrevDifficultyTarget = await this.db.get(this.blockchainFileName + "_LightSettings_prevDifficultyTarget");
            if (this.lightPrevDifficultyTarget === null) {
                console.log(colors.red("_LightSettings_prevDifficultyTarget was not found"));
                return false;
            }

            this.lightPrevTimeStamp = await this.db.get(this.blockchainFileName + "_LightSettings_prevTimestamp");
            if (this.lightPrevTimeStamp === null) {
                console.log(colors.red("_LightSettings_prevTimestamp was not found"));
                return false;
            }

            this.lightPrevHashPrev = await this.db.get(this.blockchainFileName + "_LightSettings_prevHashPrev");
            if (this.lightPrevHashPrev === null) {
                console.log(colors.red("_LightSettings_prevHashPrev was not found"));
                return false;
            }
        }

        console.log("this.lightPrevDifficultyTarget", this.lightPrevDifficultyTarget)
        console.log("this.lightPrevTimestamp", this.lightPrevTimeStamp)
        console.log("this.lightPrevHashPrev", this.lightPrevHashPrev)

        this._addTreeSerialization( numBlocks - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS - 2, serializationAccountantTreeInitial, numBlocks);

        if (this.accountantTree.root.edges.length > 0) {
            console.log("balances", this.accountantTree.root.edges[0].targetNode.balances)
            console.log("balances", this.accountantTree.root.edges[0].targetNode.balances)
        }

    }


    async save(){

        try {

            console.log("saaaave", this.blocks.length - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS -2);

            if (this.blocks.length === 0) return false;

            //AccountantTree[:-POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS]
            if (! await this.accountantTree.saveMiniAccountant( true, undefined, this.getSerializedAccountantTree( ))) throw "Couldn't save the Account Tree"

            await this._saveLightSettings();

            if (! await this.inheritBlockchain.prototype.save.call(this)) throw "couldn't save the blockchain"

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

            //AccountantTree[:-POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS]
            let result = await this.accountantTree.loadMiniAccountant(undefined, undefined, true);
            let serializationAccountantTreeInitial = this.accountantTree.serializeMiniAccountant();

            //check the accountant Tree if matches
            //console.log("this.accountantTree initial balanances ", this.accountantTree.root.edges[0].balances);
            //console.log("this.accountantTree initial ", this.accountantTree.root.hash.sha256);

            //load the number of blocks
            await this._loadLightSettings(serializationAccountantTreeInitial);

            result = result && await this.inheritBlockchain.prototype.load.call(this, consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS  );

            if (result === false){
                throw "Problem loading the blockchain";
            }

            //check the accountant Tree if matches
            console.log("this.accountantTree final", this.accountantTree.root.hash.sha256);

            return result;

        } catch (exception){

            console.log(colors.red("Couldn't load MiniBlockchain"), exception);
            this.accountantTree.root = this.accountantTree._createNode(null,  [], null )
            this._initializeMiniBlockchainLight();

            return false;
        }
    }


    getSerializedAccountantTree(height){

        if (height === undefined) height = this.blocks.length - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS - 2;

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


    _addTreeSerialization(height, serialization, blocksLength){

        blocksLength = blocksLength || this.blocks.length;

        if (height === undefined) height = blocksLength - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS-1;

        console.log("height", height, "blocksLength", blocksLength,  blocksLength - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS)

        if (serialization === undefined){
            serialization = this.accountantTree.serializeMiniAccountant();
            console.log("serializationAccountantTree", height, "   ", serialization.toString("hex"));
        }

        this.lightAccountantTreeSerializations[height] = serialization;

        //delete serializations older than [:-m]
        let index = blocksLength - consts.POW_PARAMS.LIGHT_BUFFER_LAST_BLOCKS;
        while (this.lightAccountantTreeSerializations.hasOwnProperty(index)){
            delete this.lightAccountantTreeSerializations[index];
            index--;
        }

        // updating the blocksStartingPoint
        if (this.agent.light === true) {
            this.blocksStartingPoint = blocksLength - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS-1;
            //console.log("this.blocksStartingPoint",this.blocksStartingPoint);
        }

    }


    getDifficultyTarget(height){

        if (height === undefined ) height = this.blocks.length;

        console.log(colors.yellow("difficultyTarget"), height, this.blocksStartingPoint , this.blocks.length);

        if (this.agent.light === true && height !== 0) {

            if (height === this.blocksStartingPoint  ) return this.lightPrevDifficultyTarget;
            else
            if (height < this.blocksStartingPoint  ) throw "Can not access this DifficultyTarget in Light Node "+height+"  < "+(this.blocksStartingPoint-1);
        }

        return MiniBlockchain.prototype.getDifficultyTarget.call(this, height);
    }

    getTimeStamp(height){
        if (height === undefined) height = this.blocks.length;

        console.log(colors.yellow("getTimeStamp"), height, this.blocksStartingPoint, this.lightPrevTimeStamp)

        if (this.agent.light === true && height !== 0) {

            if (height === this.blocksStartingPoint  ) return this.lightPrevTimeStamp;
            else
            if (height < this.blocksStartingPoint )  throw "Can not access this TimeStamp in Light Node";
        }

        return MiniBlockchain.prototype.getTimeStamp.call(this, height);
    }

    getHashPrev(height){
        if (height === undefined) height = this.blocks.length;

        if (this.agent.light === true && height !== 0) {

            if (height === this.blocksStartingPoint  ) return this.lightPrevHashPrev;
            else
            if (height < this.blocksStartingPoint) throw "Can not access this PrevHash in Light Node";
        }

        return MiniBlockchain.prototype.getHashPrev.call(this, height);
    }


}

export default MiniBlockchainLight;