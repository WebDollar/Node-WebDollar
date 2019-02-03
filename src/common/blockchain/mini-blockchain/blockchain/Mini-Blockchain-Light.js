import consts from 'consts/const_global'
import global from "consts/global"
import MiniBlockchainAdvanced from "./Mini-Blockchain-Advanced"
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import NodeBlockchainPropagation from "common/sockets/protocol/propagation/Node-Blockchain-Propagation";
import MiniBlockchain from "./Mini-Blockchain";
import GZip from "common/utils/GZip";

/**
 * Light Nodes virtualize prevHash, prevTimestamp and prevDifficultyTarget
 */
class MiniBlockchainLight extends  MiniBlockchainAdvanced{

    constructor (agent) {

        super(agent);

        this._initializeMiniBlockchainLight();
    }

    _initializeMiniBlockchainLight(){

        this.proofPi = undefined;
        this.blocks.clear();
        this.blocks.blocksStartingPoint = 0;

        this.lightPrevDifficultyTargets = {};
        this.lightPrevTimeStamps = {};
        this.lightPrevHashPrevs = {};

        this._lightLoadingDifficultyNextDifficulty = null;

    }

    getSavingSafePosition(height){

        if (height === undefined) height = this.blocks.length-1;

        height = height - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS;
        return height - (height +1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS
    }

    /**
     * operate the mini-blockchain accountant tree
     * mini-blockchain, will update reward and take in consideration all transactions
     * @param block
     * @param resetMining
     * @param socketsAvoidBroadcast
     * @returns {Promise.<*>}
     */
    async includeBlockchainBlock(block, resetMining, socketsAvoidBroadcast, saveBlock , revertActions, showUpdate){

        if (  !block.blockValidation.blockValidationType['skip-validation'] ) {

            console.log("block.height > ", block.height, block.hash.toString("hex") );

            if ( await this.simulateNewBlock(block, false, revertActions,

                    async () => {

                        return await this.inheritBlockchain.prototype.includeBlockchainBlock.call( this, block, resetMining, "all", saveBlock, revertActions, showUpdate);

                    },

                    showUpdate) === false

            ) throw {message: "Error Including Blockchain Light Block"};

            if (saveBlock )
                NodeBlockchainPropagation.propagateBlock( block, socketsAvoidBroadcast)

        } else {

            if (! (await this.inheritBlockchain.prototype.includeBlockchainBlock.call(this, block, resetMining, "all", saveBlock, revertActions )))
                throw {message: "Error Including Blockchain Light Block"};



        }


        return true;

    }

    async _onBlockCreated(block, saveBlock){

        MiniBlockchainAdvanced.prototype._onBlockCreated.call(this, block, saveBlock);

        if (! (await this._recalculateLightPrevs( block.height, block, this.getSerializedAccountantTree(block.height), this.getSerializedAccountantTree(block.height, true), saveBlock)))
            throw {message: "_recalculateLightPrevs failed"};

        /*console.log(" hash", block.hash.toString("hex"));
        console.log(" difficulty", block.difficultyTarget.toString("hex"));
        console.log(" prev difficulty ", block.difficultyTargetPrev.toString("hex"));
        console.log(" prev hash ", block.hashPrev.toString("hex"));

         console.log("blockchain balances ",  this.accountantTree.calculateNodeCoins(), this.accountantTree.root.hash.sha256.toString("hex") );*/
    }

    /**
     * It must be last element
     */
    async _recalculateLightPrevs(height, block, serialization, serializationGzip, save = true){

        if (block === undefined || block === null)
            block = BlockchainGenesis;

        this.lightPrevDifficultyTargets[height+1] = block.difficultyTarget;
        this.lightPrevTimeStamps[height+1] =  block.timeStamp;
        this.lightPrevHashPrevs[height+1] =  block.hash;

        // if (serialization === undefined){
        //     serialization = this.accountantTree.serializeMiniAccountant();
        //     serializationGzip = await GZip.zip(serialization);
        //     //console.log("serializationAccountantTree", diffIndex, "   ", serialization.toString("hex"));
        // }
        //
        // this.lightAccountantTreeSerializations[height+1] = serialization;
        // this.lightAccountantTreeSerializationsGzipped[height+1] = serializationGzip;

        this._deleteOldLightSettings();

        try {

            if (this.agent.light && save)
                if (this.lightPrevDifficultyTargets[ this.getSavingSafePosition(height) ] !== undefined)
                    await this._saveLightSettings( this.getSavingSafePosition(height) );

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
                diffIndex = this.getSavingSafePosition() ;

            if (! (await this.db.save(this._blockchainFileName + "_LightSettings_diffIndex", diffIndex)))
                throw {message: "Couldn't be saved _LightSettings_diffIndex", diffIndex};

            if (this.lightPrevDifficultyTargets[diffIndex] === undefined)
                throw {message: "_saveLightSettings is undefined ", diffIndex: diffIndex};

            // console.warn("this.blocks.blocksStartingPoint ", this.blocks.blocksStartingPoint );

            let treeSerialization = this.getSerializedAccountantTree(diffIndex);

            if (! (await this.accountantTree.saveMiniAccountant(true, undefined, treeSerialization)))
                throw {message: "saveMiniAccountant", diffIndex};

            if (! (await this.db.save(this._blockchainFileName + "_LightSettings_prevDifficultyTarget", this.lightPrevDifficultyTargets[diffIndex])))
                throw {message: "Couldn't be saved _LightSettings_prevDifficultyTarget", diffIndex: diffIndex};

            if (! (await this.db.save(this._blockchainFileName + "_LightSettings_prevDifficultyTargetStart", this.lightPrevDifficultyTargets[diffIndex+1])))
                throw {message: "Couldn't be saved _LightSettings_prevDifficultyTargetStart", diffIndex: diffIndex};

            if (! (await this.db.save(this._blockchainFileName + "_LightSettings_prevTimestamp", this.lightPrevTimeStamps[diffIndex])))
                throw {message: "Couldn't be saved _LightSettings_prevTimestamp ", diffIndex: diffIndex};

            if (! (await this.db.save(this._blockchainFileName + "_LightSettings_prevHashPrev", this.lightPrevHashPrevs[diffIndex])))
                throw {message: "Couldn't be saved _LightSettings_prevHashPrev ", diffIndex:diffIndex};

        } catch (exception){
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
            return {result:false};
        }

        // trying to read the diffIndex
        let diffIndex = await this.db.get(this._blockchainFileName + "_LightSettings_diffIndex");

        if ( diffIndex === null || diffIndex === undefined)

            if (diffIndex < consts.BLOCKCHAIN.HARD_FORKS.TEST_NET_3)
                diffIndex = numBlocks - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS -1 ;
            else
                diffIndex = this.getSavingSafePosition(numBlocks-1);

        console.log("DIFFFINDEXAFTER", diffIndex);

        if (numBlocks > consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS) {

            this.lightAccountantTreeSerializations[diffIndex] = serializationAccountantTreeInitial;
            this.lightAccountantTreeSerializationsGzipped[diffIndex] = await GZip.zip(serializationAccountantTreeInitial);

            this.lightPrevDifficultyTargets[diffIndex] = await this.db.get(this._blockchainFileName + "_LightSettings_prevDifficultyTarget");
            if (this.lightPrevDifficultyTargets[diffIndex] === null) {
                console.error("_LightSettings_prevDifficultyTarget was not found");
                return {result:false};
            }

            this._lightLoadingDifficultyNextDifficulty = await this.db.get(this._blockchainFileName + "_LightSettings_prevDifficultyTargetStart");

            this.lightPrevTimeStamps[diffIndex] = await this.db.get(this._blockchainFileName + "_LightSettings_prevTimestamp");
            if (this.lightPrevTimeStamps[diffIndex] === null) {
                console.error("_LightSettings_prevTimestamp was not found");
                return {result:false};
            }

            this.lightPrevHashPrevs[diffIndex] = await this.db.get(this._blockchainFileName + "_LightSettings_prevHashPrev");
            if (this.lightPrevHashPrevs[diffIndex] === null) {
                console.error("_LightSettings_prevHashPrev was not found");
                return {result:false};
            }

        } else throw {message:"Error Loading Light Settings"};


        this.blocks.blocksStartingPoint = diffIndex  ;

        console.log("diffIndex", diffIndex);
        console.log("this.lightPrevDifficultyTarget", this.lightPrevDifficultyTargets[diffIndex] !== undefined ? this.lightPrevDifficultyTargets[diffIndex].toString("hex") : '');
        console.log("", this.lightPrevDifficultyTargets[diffIndex] !== undefined ? this.lightPrevDifficultyTargets[diffIndex].toString("hex") : '');
        console.log("this.lightPrevTimestamp", this.lightPrevTimeStamps[diffIndex]);
        console.log("this.lightPrevHashPrev", this.lightPrevHashPrevs[diffIndex] !== undefined ? this.lightPrevHashPrevs[diffIndex].toString("hex")  : '');

        return {
            result:true,
            numBlocks: numBlocks,
            diffIndex: diffIndex
        };

    }


    async saveBlockchainTerminated(){

        await MiniBlockchainAdvanced.prototype.saveBlockchainTerminated.call(this);

        if (process.env.BROWSER)
            return true;

        try {

            global.MINIBLOCKCHAIN_LIGHT_SAVED = false;

            if (this.blocks.length === 0)
                throw {message: "Nothing to Save"};

            await this._saveLightSettings();

            if (! (await this.inheritBlockchain.prototype.saveBlockchain.call(this, this.blocks.length - this.getSavingSafePosition() )))
                throw {message: "couldn't save the blockchain"};

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
    async _loadBlockchain(){

        if (process.env.BROWSER)
            return true;

        try {

            //AccountantTree[:-BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS]
            if (! (await this.accountantTree.loadMiniAccountant(undefined, undefined, true)))
                throw {message: "Problem Loading Mini Accountant Tree Initial"};

            console.log("loading blockchain balances ",  this.accountantTree.calculateNodeCoins(), this.accountantTree.root.hash.sha256.toString("hex") );

            let serializationAccountantTreeInitial = this.accountantTree.serializeMiniAccountant();

            //check the accountant Tree if matches
            //console.log("this.accountantTree initial balanances ", this.accountantTree.root.edges[0].balances);
            //console.log("this.accountantTree initial ", this.accountantTree.root.hash.sha256);

            //load the number of blocks
            let answer = await this._loadLightSettings(serializationAccountantTreeInitial)

            if (!answer.result)
                throw {message: "couldn't load the Light Settings"};

            this._difficultyNotValidated = false;

            if (! (await this.inheritBlockchain.prototype._loadBlockchain.call(this, answer.diffIndex -1 )))
                throw {message: "Problem loading the blockchain"};

            //check the accountant Tree if matches
            console.log("this.accountantTree final", this.accountantTree.root.hash.sha256);

            return true;

        } catch (exception){

            console.error("Couldn't load Light MiniBlockchain", exception);
            this.accountantTree.createRoot();
            this._initializeMiniBlockchainLight();

            return false;
        }

    }

    _getLoadBlockchainValidationType(indexStart, i, numBlocks, onlyLastBlocks){

        let validationType = {};

        if ( this.agent !== undefined && this.agent.light === true) {

            //I can not validate timestamp for the first consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS blocks
            if (i - indexStart < numBlocks + consts.BLOCKCHAIN.TIMESTAMP.VALIDATION_NO_BLOCKS)
                validationType["skip-validation-timestamp"] = true;

            if ( !this._difficultyNotValidated )
                validationType["skip-difficulty-recalculation"] = true;

            if ( (i+1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS === 0 && (i-indexStart) >= consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS ) {
                this._difficultyNotValidated = true;
                validationType["skip-difficulty-recalculation"] = false;
            }

            console.log( "_getLoadBlockchainValidationType", i, (i-indexStart), this._difficultyNotValidated );
        }

        return validationType;
    }

    async _loadBlock(indexStart, i, blockValidation){

        let block = await MiniBlockchainAdvanced.prototype._loadBlock.call(this, indexStart, i, blockValidation);

        if ( (i + 1) % consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS  === 0 && i === indexStart){


            block.difficultyTarget = this._lightLoadingDifficultyNextDifficulty;

            this.lightPrevDifficultyTargets[i+1] = this._lightLoadingDifficultyNextDifficulty;

        }

        return block;
    }


    _deleteOldLightSettings(){

        //delete serializations older than [:-m]

        let index = this.blocks.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_ACCOUNTANT_TREES - 2;

        while (this.lightPrevDifficultyTargets.hasOwnProperty(index)){

            delete this.lightAccountantTreeSerializations[index];
            delete this.lightAccountantTreeSerializationsGzipped[index];
            delete this.lightPrevDifficultyTargets[index];
            delete this.lightPrevHashPrevs[index];
            delete this.lightPrevTimeStamps[index];

            index--;
        }

    }

    getBlock(height){

        if (height === undefined )
            height = this.blocks.length;

        if (this.agent !== undefined && this.agent.light === true && height !== 0) {

            if (this.proofPi !== undefined) {
                let proofPiBlock = this.proofPi.hasBlock(height-1);
                if (proofPiBlock !== undefined && proofPiBlock !== null)
                    return proofPiBlock;
            }

        }

        return MiniBlockchainAdvanced.prototype.getBlock.call(this, height);
    }

    getDifficultyTarget(height){

        if (height === undefined )
            height = this.blocks.length;

        if (this.agent !== undefined && this.agent.light === true && height !== 0) {

            if (this.lightPrevDifficultyTargets[height] !== undefined )
                return this.lightPrevDifficultyTargets[height];
        }

        return MiniBlockchainAdvanced.prototype.getDifficultyTarget.call(this, height);
    }

    getTimeStamp(height){
        if (height === undefined) height = this.blocks.length;

        if (this.agent.light === true && height !== 0) {
            if ( this.lightPrevTimeStamps[height] !== undefined )
                return this.lightPrevTimeStamps[height];
        }

        return MiniBlockchainAdvanced.prototype.getTimeStamp.call(this, height);
    }

    getHashPrev(height){

        if (height === undefined) height = this.blocks.length;

        if (this.agent.light === true && height !== 0)
            if ( this.lightPrevHashPrevs[height] !== undefined )
                return this.lightPrevHashPrevs[height];

        return MiniBlockchainAdvanced.prototype.getHashPrev.call(this, height);
    }



}

export default MiniBlockchainLight;