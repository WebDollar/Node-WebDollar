import consts from 'consts/const_global'
import global from "consts/global"
import Serialization from "common/utils/Serialization";
import MiniBlockchain from "./Mini-Blockchain"
import MiniBlockchainAccountantTree from '../state/Mini-Blockchain-Accountant-Tree'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'


/**
 * Light Nodes virtualize prevHash, prevTimestamp and prevDifficultyTarget
 */
class MiniBlockchainLight extends  MiniBlockchain{

    constructor (agent) {

        super(agent);

        this._initializeMiniBlockchainLight();
    }

    _initializeMiniBlockchainLight(){

        this.blocks.clear();
        this.blocks.blocksStartingPoint = 0;

        this.lightAccountantTreeSerializations = {};

        this.lightPrevDifficultyTargets = {};
        this.lightPrevTimeStamps = {};
        this.lightPrevHashPrevs = {};
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

        // console.log("blockchain serialization1", this.accountantTree.serializeMiniAccountant().toString("hex") );
        // console.log("blockchain serialization1", this.accountantTree.calculateNodeCoins(), this.accountantTree.root.hash.sha256.toString("hex"));

        if (  !block.blockValidation.blockValidationType['skip-validation'] ) {

            console.log("block.height > ", block.height);

            if (! (await this.simulateNewBlock(block, false, async () => {
                return await this.inheritBlockchain.prototype.includeBlockchainBlock.call( this, block, resetMining, "all", saveBlock );
            }))) throw "Error Including Blockchain Light Block";

            console.log("this.blocks.height",block.height);
            //console.log("this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS - 2", this.blocks.length - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 2);

            if (saveBlock ){

                // propagating a new block in the network
                this.propagateBlocks(block.height, socketsAvoidBroadcast)
            }


        } else {

            if (! (await this.inheritBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, "all", saveBlock )))
                throw "Error Including Blockchain Light Block";

            //for debugging only
        }

        if (! (await this._recalculateLightPrevs( block.height, block, undefined, saveBlock)))
            throw "_recalculateLightPrevs failed";

        //console.log("BLOCK ", block.serializeBlock().toString("hex"));
        console.log(" hash", block.hash.toString("hex"));
        console.log(" difficulty", block.difficultyTarget.toString("hex"));
        console.log(" prev difficulty ", block.difficultyTargetPrev.toString("hex"));
        console.log(" prev hash ", block.hashPrev.toString("hex"));

        console.log("blockchain balances ",  this.accountantTree.calculateNodeCoins(), this.accountantTree.root.hash.sha256.toString("hex") );

        return true;

    }

    /**
     * It must be last element
     */
    async _recalculateLightPrevs(height, block, serialization, save = true){

        if (block === undefined || block === null)
            block = BlockchainGenesis;

        this.lightPrevDifficultyTargets[height+1] = block.difficultyTarget;
        this.lightPrevTimeStamps[height+1] =  block.timeStamp;
        this.lightPrevHashPrevs[height+1] =  block.hash;

        console.log("diffIndex", height);
        console.log("block.hash", block.hash.toString("hex"));

        if (this.agent.light === true)
            this.blocks.blocksStartingPoint = height - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS ;

        if (serialization === undefined){
            serialization = this.accountantTree.serializeMiniAccountant();
            //console.log("serializationAccountantTree", diffIndex, "   ", serialization.toString("hex"));
        }

        this.lightAccountantTreeSerializations[height+1] = serialization;

        this._deleteOldLightSettings();

        try {

            if (this.agent.light && save)
                if (this.lightPrevDifficultyTargets[height - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS] !== undefined)
                    await this._saveLightSettings(height - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS);

        } catch (exception){
            console.error("Couldn't save Light Settings _saveLightSettings", exception);
        }

        return true;
    }

    async _saveLightSettings(diffIndex){

        if (process.env.BROWSER)
            return true;

        try {
            global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED = false;

            console.log("_LightPrevDifficultyTarget saved");

            if (diffIndex === undefined)
                diffIndex = this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS - 1;

            if (! (await this.db.save(this._blockchainFileName + "_LightSettings_diffIndex", diffIndex)))
                throw "Couldn't be saved _LightSettings_diffIndex";

            if (this.lightPrevDifficultyTargets[diffIndex] === undefined)
                throw "_saveLightSettings is undefined "+diffIndex;

            // console.warn("this.blocks.blocksStartingPoint ", this.blocks.blocksStartingPoint );

            let treeSerialization = this.getSerializedAccountantTree(diffIndex);
            //console.warn("this.getSerializedAccountantTree ", diffIndex, treeSerialization !== undefined ? treeSerialization.toString('hex') : '');

            if (! (await this.accountantTree.saveMiniAccountant(true, undefined, treeSerialization)))
                throw "saveMiniAccountant";

            // console.warn("this.lightPrevDifficultyTarget", this.lightPrevDifficultyTargets[diffIndex] !== undefined ? this.lightPrevDifficultyTargets[diffIndex].toString("hex") : '');
            // console.warn("this.lightPrevTimestamp", this.lightPrevTimeStamps[diffIndex]);
            // console.warn("this.lightPrevHashPrev", this.lightPrevHashPrevs[diffIndex] !== undefined ? this.lightPrevHashPrevs[diffIndex].toString("hex") : '');

            if (! (await this.db.save(this._blockchainFileName + "_LightSettings_prevDifficultyTarget", this.lightPrevDifficultyTargets[diffIndex])))
                throw "Couldn't be saved _LightSettings_prevDifficultyTarget";
            
            if (! (await this.db.save(this._blockchainFileName + "_LightSettings_prevTimestamp", this.lightPrevTimeStamps[diffIndex])))
                throw "Couldn't be saved _LightSettings_prevTimestamp ";
            
            if (! (await this.db.save(this._blockchainFileName + "_LightSettings_prevHashPrev", this.lightPrevHashPrevs[diffIndex])))
                throw "Couldn't be saved _LightSettings_prevHashPrev ";

        } catch (exception){
            console.error("Error saving LIGHT SETTINGS", exception);
            console.error("Error saving LIGHT SETTINGS", exception);
            console.error("Error saving LIGHT SETTINGS", exception);
            global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED = true;

            throw exception;
        }

        global.MINIBLOCKCHAIN_LIGHT_CONFIGURATION_SAVED = true;
        return true;
    }

    async _loadLightSettings(serializationAccountantTreeInitial){

        console.log("_loadLightSettings load" );

        let numBlocks = await this.db.get(this._blockchainFileName);
        if (numBlocks === null ) {
            console.error("numBlocks was not found");
            return false;
        }

        // trying to read the diffIndex
        let diffIndex = await this.db.get(this._blockchainFileName + "_LightSettings_diffIndex");

        if ( diffIndex === null || diffIndex === undefined || diffIndex > numBlocks - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS - 1)
            diffIndex = numBlocks - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS -1 ;

        console.log("DIFFFINDEXAFTER", diffIndex);

        if (numBlocks > consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS) {

            this.lightAccountantTreeSerializations[diffIndex] = serializationAccountantTreeInitial;

            this.lightPrevDifficultyTargets[diffIndex] = await this.db.get(this._blockchainFileName + "_LightSettings_prevDifficultyTarget");

            if (this.lightPrevDifficultyTargets[diffIndex] === null) {
                console.error("_LightSettings_prevDifficultyTarget was not found");
                return false;
            }

            this.lightPrevTimeStamps[diffIndex] = await this.db.get(this._blockchainFileName + "_LightSettings_prevTimestamp");
            if (this.lightPrevTimeStamps[diffIndex] === null) {
                console.error("_LightSettings_prevTimestamp was not found");
                return false;
            }

            this.lightPrevHashPrevs[diffIndex] = await this.db.get(this._blockchainFileName + "_LightSettings_prevHashPrev");
            if (this.lightPrevHashPrevs[diffIndex] === null) {
                console.error("_LightSettings_prevHashPrev was not found");
                return false;
            }

        } else throw "Error Loading Light Settings";

        if (this.agent.light === true)
            this.blocks.blocksStartingPoint = numBlocks - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS -1  ;

        console.log("diffIndex", diffIndex);
        console.log("this.lightPrevDifficultyTarget", this.lightPrevDifficultyTargets[diffIndex] !== undefined ? this.lightPrevDifficultyTargets[diffIndex].toString("hex") : '');
        console.log("", this.lightPrevDifficultyTargets[diffIndex] !== undefined ? this.lightPrevDifficultyTargets[diffIndex].toString("hex") : '');
        console.log("this.lightPrevTimestamp", this.lightPrevTimeStamps[diffIndex]);
        console.log("this.lightPrevHashPrev", this.lightPrevHashPrevs[diffIndex] !== undefined ? this.lightPrevHashPrevs[diffIndex].toString("hex")  : '');


        return true;

    }


    async saveBlockchain(){

        if (process.env.BROWSER)
            return true;

        try {

            global.MINIBLOCKCHAIN_LIGHT_SAVED = false;

            if (this.blocks.length === 0)
                throw "Nothing to Save";

            await this._saveLightSettings();

            if (! (await this.inheritBlockchain.prototype.saveBlockchain.call(this, consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS )))
                throw "couldn't save the blockchain";

        } catch (exception){
            console.error("Couldn't save MiniBlockchain", exception);
            global.MINIBLOCKCHAIN_LIGHT_SAVED = true;
            return false;
        }

        global.MINIBLOCKCHAIN_LIGHT_SAVED = true;
        return true;
    }

    /**
     * Load blocks and check the Accountant Tree
     * @returns boolean
     */
    async loadBlockchain(){

        if (process.env.BROWSER)
            return true;

        try {

            //AccountantTree[:-BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS]
            if (! (await this.accountantTree.loadMiniAccountant(undefined, undefined, true)))
                throw "Problem Loading Mini Accountant Tree Initial";

            console.log("loading blockchain balances ",  this.accountantTree.calculateNodeCoins(), this.accountantTree.root.hash.sha256.toString("hex") );

            let serializationAccountantTreeInitial = this.accountantTree.serializeMiniAccountant();

            //check the accountant Tree if matches
            //console.log("this.accountantTree initial balanances ", this.accountantTree.root.edges[0].balances);
            //console.log("this.accountantTree initial ", this.accountantTree.root.hash.sha256);

            //load the number of blocks
            if (! (await this._loadLightSettings(serializationAccountantTreeInitial)))
                throw "couldn't load the Light Settings";

            if (! (await this.inheritBlockchain.prototype.loadBlockchain.call(this, consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS  )))
                throw "Problem loading the blockchain";

            //check the accountant Tree if matches
            console.log("this.accountantTree final", this.accountantTree.root.hash.sha256);

            return true;

        } catch (exception){

            console.error("Couldn't load Light MiniBlockchain", exception);
            this.accountantTree.root = this.accountantTree._createNode(null,  [], null )
            this._initializeMiniBlockchainLight();

            return false;
        }
    }


    _deleteOldLightSettings(){

        //delete serializations older than [:-m]

        let index = this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS - 3;
        while (this.lightAccountantTreeSerializations.hasOwnProperty(index)){
            delete this.lightAccountantTreeSerializations[index];
            delete this.lightPrevDifficultyTargets[index];
            delete this.lightPrevHashPrevs[index];
            delete this.lightPrevTimeStamps[index];
            index--;
        }

    }

    getSerializedAccountantTree(height){

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

    getDifficultyTarget(height){

        if (height === undefined )
            height = this.blocks.length;

        console.warn("difficultyTarget", height, this.blocks.blocksStartingPoint , this.blocks.length, this.lightPrevDifficultyTargets[height] !== undefined ? this.lightPrevDifficultyTargets[height].toString("hex") : '');

        if (this.agent.light === true && height !== 0) {

            if (this.lightPrevDifficultyTargets[height] !== undefined )
                return this.lightPrevDifficultyTargets[height];
        }

        return MiniBlockchain.prototype.getDifficultyTarget.call(this, height);
    }

    getTimeStamp(height){
        if (height === undefined) height = this.blocks.length;

        console.warn("getTimeStamp", height, this.blocks.blocksStartingPoint, this.lightPrevTimeStamps[height])

        if (this.agent.light === true && height !== 0) {
            if ( this.lightPrevTimeStamps[height] !== undefined )
                return this.lightPrevTimeStamps[height];
        }

        return MiniBlockchain.prototype.getTimeStamp.call(this, height);
    }

    getHashPrev(height){

        if (height === undefined) height = this.blocks.length;

        console.warn("getHashPrev", height, this.blocks.blocksStartingPoint, this.lightPrevHashPrevs[height] !== undefined ? this.lightPrevHashPrevs[height].toString("hex") : '')

        if (this.agent.light === true && height !== 0)
            if ( this.lightPrevHashPrevs[height] !== undefined )
                return this.lightPrevHashPrevs[height];

        return MiniBlockchain.prototype.getHashPrev.call(this, height);
    }


}

export default MiniBlockchainLight;