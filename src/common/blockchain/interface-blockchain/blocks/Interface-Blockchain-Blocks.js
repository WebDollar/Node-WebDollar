import consts from 'consts/const_global'
import StatusEvents from "common/events/Status-Events"

const BigInteger = require('big-integer');
const BigNumber = require('bignumber.js');
import BlockchainGenesis from './../../../../common/blockchain/global/Blockchain-Genesis'

import Serialization from "common/utils/Serialization";
import InterfaceBlockchainBlockTimestamp from "./../blocks/Interface-Blockchain-Block-Timestamp"
import WebDollarCrypto from "../../../crypto/WebDollar-Crypto";

/**
 * It creates like an Array of Blocks. In case the Block doesn't exist, it will be stored as `undefined`
 **/

class InterfaceBlockchainBlocks{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.blocksStartingPoint = 0;
        this._length = 0;

        this._networkHashRate = 0 ;

        this._chainWork =  new BigInteger(0);
        this.chainWorkSerialized = new Buffer(0);

        if (consts.SETTINGS.FREE_TRANSACTIONS_FROM_MEMORY_MAX_NUMBER > 0)
            setTimeout( this._freeAllBlocksTransactionsFromMemory.bind(this), 100000 );

        this.timestampBlocks = new InterfaceBlockchainBlockTimestamp(blockchain);
    }

    addBlock(block, revertActions, saveBlock, showUpdate = true){

        this[this.length] =  block;

        this.length += 1;

        if (showUpdate)
            this.emitBlockCountChanged();

        if (saveBlock)
            this.emitBlockInserted(block);

        //delete old blocks when I am in light node
        if (this.blockchain.agent && this.blockchain.agent.light){

            let index = this.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE;

            while (this[index] ){
                this[index].destroyBlock();
                delete this[index];

                index--;
            }

            while (this.length > 0 && !this[this.blocksStartingPoint] && this.blocksStartingPoint < this.length)
                this.blocksStartingPoint++;

        }

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

    spliceBlocks(after, freeMemory = false, showUpdate = true){

        for (let i = this.length - 1; i >= after; i--)
            if (this[i] !== undefined){

                this.chainWork = this.chainWork.minus( this[i].workDone );

                if (freeMemory) {
                    this[i].destroyBlock();
                    delete this[i];
                }
                else
                    this[i] = undefined;

            }

        if (this.length === 0)
            this._chainWork =  new BigInteger(0);

        this.length = after;

        if (showUpdate)
            this.emitBlockCountChanged();
    }

    clear(){

        this.spliceBlocks(0, true);

    }

    get endingPosition(){

        if (this.blockchain.agent.light)
            return this.blockchain.blocks.length;
        else //full node
            return this.blockchain.blocks.length;
    }

    // aka head
    get last() {
        return this[this.length - 1];
    }

    // aka tail
    get first() {
        return this[ this.blocksStartingPoint ];
    }

    recalculateNetworkHashRate (){

        let MaxTarget = consts.BLOCKCHAIN.BLOCKS_MAX_TARGET;
        let diff;

        let SumDiffPoS = new BigNumber( 0 );
        let SumDiffPoW = new BigNumber( 0 );

        let last, first;
        for (let i = Math.max(0, this.blockchain.blocks.endingPosition - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS*3); i<this.blockchain.blocks.endingPosition; i++) {

            if (this.blockchain.blocks[i] === undefined) continue;
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

    _freeAllBlocksTransactionsFromMemory(){

        if (consts.SETTINGS.FREE_TRANSACTIONS_FROM_MEMORY_MAX_NUMBER <= 0) return false;

        try {

            for (let i = 0; i < Math.max(0, Math.floor( this.length - consts.SETTINGS.FREE_TRANSACTIONS_FROM_MEMORY_MAX_NUMBER ) ); i++)
                if (this[i] !== undefined)
                    this[i].data.transactions.freeTransactionsFromMemory();

        } catch (exception){
            console.error("_freeAllBlocksTransactionsFromMemory raised an error", this[i].data.transactions.freeTransactionsFromMemory() );
        }

        setTimeout( this._freeAllBlocksTransactionsFromMemory.bind(this), 100000 );

    }


}

export default InterfaceBlockchainBlocks;
