import const_global  from './../../../../consts/const_global';
import StatusEvents  from './../../../events/Status-Events';
import Serialization from './../../../utils/Serialization';
import InterfaceBlockchainBlockTimestamp from './../blocks/Interface-Blockchain-Block-Timestamp';
import NetworkHashRateCalculator         from '../../../../components/NetworkHashRateCalculator';

const BigInteger = require('big-integer');

/**
 * It creates like an Array of Blocks. In case the Block doesn't exist, it will be stored as `undefined`
 **/
class InterfaceBlockchainBlocks {

    constructor(blockchain) {

        this.blockchain                  = blockchain;
        this.blocksStartingPoint         = 0;
        this._length                     = 0;
        this._networkHashRate            = 0 ;
        this._chainWork                  = new BigInteger(0);
        this.chainWorkSerialized         = new Buffer(0);
        this.timestampBlocks             = new InterfaceBlockchainBlockTimestamp(blockchain);
        this._oNetworkHashRateCalculator = new NetworkHashRateCalculator(blockchain, const_global.BLOCKCHAIN.BLOCKS_MAX_TARGET, const_global.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS);
    }

    addBlock(block, revertActions, saveBlock, showUpdate = true){

        this[this.length] =  block;

        this.length += 1;

        if (showUpdate)
        {
            this.emitBlockCountChanged();
        }

        if (saveBlock)
        {
            this.emitBlockInserted(block);
        }

        //delete old blocks when I am in light node
        if (typeof this.blockchain.agent !== 'undefined' && this.blockchain.agent.light)
        {
            let index = this.length - const_global.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE;

            while (typeof this[index] !== 'undefined')
            {
                this[index].destroyBlock();
                delete this[index];
                index--;
            }

            while (this.length > 0 && typeof this[this.blocksStartingPoint] === 'undefined' && this.blocksStartingPoint < this.length)
            {
                this.blocksStartingPoint++;
            }
        }

        if (typeof revertActions !== 'undefined')
        {
            revertActions.push({
                name: 'block-added',
                height: this.length - 1
            });
        }

        this.chainWork = this.chainWork.plus(block.workDone);
    }

    emitBlockInserted(block) {
        StatusEvents.emit('blockchain/block-inserted', typeof block !== 'undefined' ? block : this[this._length-1]);
    }

    emitBlockCountChanged() {
        StatusEvents.emit('blockchain/blocks-count-changed', this._length);
    }

    spliceBlocks(after, freeMemory = false, showUpdate = true) {

        for (let i = this.length - 1; i >= after; i--)
        {
            if (typeof this[i] !== 'undefined')
            {
                this.chainWork = this.chainWork.minus(this[i].workDone);

                if (freeMemory)
                {
                    this[i].destroyBlock();
                    delete this[i];
                }
                else
                {
                    this[i] = undefined;
                }
            }
        }

        if (this.length === 0)
        {
            this._chainWork =  new BigInteger(0);
        }

        this.length = after;

        if (showUpdate)
        {
            this.emitBlockCountChanged();
        }
    }

    clear() {
        this.spliceBlocks(0, true);
    }

    get endingPosition() {
        if (this.blockchain.agent.light)
        {
            return this.blockchain.blocks.length;
        }
        else //full node
        {
            return this.blockchain.blocks.length;
        }
    }

    // aka head
    get last() {
        return this[this.length - 1];
    }

    // aka tail
    get first() {
        return this[this.blocksStartingPoint];
    }

    recalculateNetworkHashRate() {

        const fNetworkHashRate = this._oNetworkHashRateCalculator.calculate();
        this.networkHashRate   = fNetworkHashRate;
        return fNetworkHashRate;
    }

    set networkHashRate(newValue) {
        this._networkHashRate = newValue;
        StatusEvents.emit('blockchain/new-network-hash-rate', this._networkHashRate);

    }

    get networkHashRate() {
        return this._networkHashRate;
    }

    set length(newValue) {
        this._length = newValue;
    }

    get length() {
        return this._length;
    }

    set chainWork(newValue) {
        this._chainWork          = newValue;
        this.chainWorkSerialized = Serialization.serializeBigInteger( newValue );
    }

    get chainWork() {
        return this._chainWork;
    }
}

export default InterfaceBlockchainBlocks;
