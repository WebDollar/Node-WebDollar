import consts from 'consts/const_global'
import StatusEvents from "common/events/Status-Events.js"
/**
 * It creates like an Array of Blocks. In case the Block doesn't exist, it will be stored as `undefined`
 **/

class InterfaceBlockchainBlocks{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.blocksStartingPoint = 0;
        this.length = 0;
    }

    addBlock(block){

        this[this.length] =  block;
        this.length += 1;

        StatusEvents.emit("blockchain/blocks-count-changed", this.length);
        StatusEvents.emit("blockchain/block-inserted", block);

        //delete old blocks when I am in light node
        if (this.blockchain.agent.light){

            let index = this.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS -3;
            while (this[index] !== undefined){
                delete this[index];
                index--;
            }

        }

    }

    spliceBlocks(after, freeMemory = false){

        for (let i = this.length - 1; i >= after; i--)
            if (this[i] !== undefined){
                if (freeMemory)
                    delete this[i];
                else
                    this[i] = undefined;
            }

        this.length = after;

        StatusEvents.emit("blockchain/blocks-count-changed", this.length);
    }

    clear(){

        this.spliceBlocks(0)

    }

}

export default InterfaceBlockchainBlocks;