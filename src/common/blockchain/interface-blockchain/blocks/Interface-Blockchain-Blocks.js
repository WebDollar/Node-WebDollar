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

        this.blockchain.emitter.emit("blockchain/blocks-count-changed", this.length);
        this.blockchain.emitter.emit("blockchain/block-inserted", block);
    }

    spliceBlocks(after, freeMemory=false){

        for (let i=this.length-1; i>=after; i--)
            if (this[i] !== undefined){
                if (freeMemory)
                    delete this[i];
                else
                    this[i] = undefined;
            }

        this.length = after;

        this.blockchain.emitter.emit("blockchain/blocks-count-changed", this.length);
    }

    clear(){

        this.spliceBlocks(0)

    }

}

export default InterfaceBlockchainBlocks;