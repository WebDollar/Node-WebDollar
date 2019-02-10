import consts from 'consts/const_global'
import StatusEvents from "common/events/Status-Events"

const BigInteger = require('big-integer');
const BigNumber = require('bignumber.js');
import BlockchainGenesis from 'src/common/blockchain/global/Blockchain-Genesis'

import Serialization from "common/utils/Serialization";
import InterfaceBlockchainBlockTimestamp from "./../blocks/Interface-Blockchain-Block-Timestamp"
import WebDollarCrypto from "../../../crypto/WebDollar-Crypto";

import SavingManager from "common/blockchain/utils/saving-manager/Saving-Manager"
import LoadingManager from "common/blockchain/utils/saving-manager/Loading-Manager"
import Log from "../../../utils/logging/Log";

/**
 * It creates like an Array of Blocks. In case the Block doesn't exist, it will be stored as `undefined`
 **/

class InterfaceBlockchainBlocks{

    constructor(blockchain, db){

        this.blockchain = blockchain;

        this.db = db;

        this.blocksStartingPoint = 0;
        this._length = 0;

        this._networkHashRate = 0 ;

        this._chainWork =  new BigInteger(0);
        this.chainWorkSerialized = new Buffer(0);


        this.timestampBlocks = new InterfaceBlockchainBlockTimestamp(blockchain);

        this.savingManager = new SavingManager(this);
        this.loadingManager = new LoadingManager(this);
        this._blockchainFileName = consts.DATABASE_NAMES.BLOCKCHAIN_DATABASE.FILE_NAME;

    }

    addBlock(block, revertActions, saveBlock, showUpdate = true){

        this[this.length] =  block;

        this.length += 1;

        if (showUpdate)
            this.emitBlockCountChanged();

        if (saveBlock)
            this.emitBlockInserted(block);

        if ( revertActions )
            revertActions.push( {name: "block-added", height: this.length-1 } );

        this.chainWork = this.chainWork.plus( block.workDone );


    }

    emitBlockInserted(block){
        StatusEvents.emit("blockchain/block-inserted", block !== undefined ? block : this[this._length-1]);
    }

    emitBlockCountChanged(){
        StatusEvents.emit("blockchain/blocks-count-changed", this._length);
    }

    async spliceBlocks(after, showUpdate = true){

        for (let i = this.length - 1; i >= after; i--) {

            //optimize save workDone for each block
            let block = await this.getBlock(i);

            this.chainWork = this.chainWork.minus( block.workDone);
        }

        if (this.length === 0)
            this._chainWork =  new BigInteger(0);

        this.length = after;

        if (showUpdate)
            this.emitBlockCountChanged();
    }

    clearBlocks(){
        return this.spliceBlocks(0, true);
    }

    get endingPosition(){

        //full node
        return this.length;

    }

    // aka head
    get last() {
        return this.getBlock(this.length - 1);
    }

    // aka tail
    get first() {
        return this.getBLock( this.blocksStartingPoint );
    }

    async recalculateNetworkHashRate(){

        let MaxTarget = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET;
        let diff;

        let SumDiffPoS = new BigNumber( 0 );
        let SumDiffPoW = new BigNumber( 0 );

        let last, first;
        for (let i = Math.max( this.blockchain.blocks.blocksStartingPoint, Math.max(0, this.blockchain.blocks.endingPosition - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS*3)); i<this.blockchain.blocks.endingPosition; i++) {

            if (i < 0) continue;
            diff = MaxTarget.dividedBy( new BigNumber ( "0x"+ this.blockchain.blocks[i].difficultyTarget.toString("hex") ) );

            if( BlockchainGenesis.isPoSActivated( this.blockchain.blocks[i].height ) )
                SumDiffPoS = SumDiffPoS.plus( diff );
            else
                SumDiffPoW = SumDiffPoW.plus( diff );

            if (!first) first = i;
            last = i;

        }

        let how_much_it_took_to_mine_X_Blocks = this.blockchain.getTimeStamp( last ) - this.blockchain.getTimeStamp( first );
        let answer;

        if( BlockchainGenesis.isPoSActivated(this.blockchain.blocks.length-1) )
            answer = SumDiffPoS.dividedToIntegerBy(new BigNumber(how_much_it_took_to_mine_X_Blocks.toString() )).toFixed(13);
        else
            answer = SumDiffPoW.dividedToIntegerBy(new BigNumber(how_much_it_took_to_mine_X_Blocks.toString() )).toFixed(13);

        this.networkHashRate = parseFloat(answer);
        return parseFloat(answer);

    }

    set networkHashRate(newValue){

        this._networkHashRate = newValue;
        StatusEvents.emit("blockchain/new-network-hash-rate", this._networkHashRate );

    }

    get networkHashRate(){
        return this._networkHashRate;
    }

    set length(newValue){
        this._length = newValue;
    }

    get length(){
        return this._length;
    }

    set chainWork(newValue){
        this._chainWork = newValue;
        this.chainWorkSerialized = Serialization.serializeBigInteger( newValue );
    }

    get chainWork(){
        return this._chainWork;
    }

    async readBLockchainLength(){

        let numBlocks = await this.db.get(this._blockchainFileName, 200, 1000000);

        if ( !numBlocks ) {
            Log.error("Error reading the blocks.length", Log.LOG_TYPE.SAVING_MANAGER);
            return undefined;
        }

        return numBlocks;
    }

    async saveBlockchainLength(length = this.length){

        let answer = await this.db.save(this._blockchainFileName, length, 20000, 1000000) ;

        if (!answer) {
            Log.error("Error saving the blocks.length", Log.LOG_TYPE.SAVING_MANAGER);
            return false;
        }

        return true;

    }

}

export default InterfaceBlockchainBlocks;
