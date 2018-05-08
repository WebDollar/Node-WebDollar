import consts from 'consts/const_global'
import StatusEvents from "common/events/Status-Events"
var BigNumber = require ('bignumber.js');
/**
 * It creates like an Array of Blocks. In case the Block doesn't exist, it will be stored as `undefined`
 **/

class InterfaceBlockchainBlocks{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.blocksStartingPoint = 0;
        this.length = 0;

        this.networkHashRate = 0 ;
    }

    addBlock(block){

        this[this.length] =  block;
        this.length += 1;

        StatusEvents.emit("blockchain/blocks-count-changed", this.length);
        StatusEvents.emit("blockchain/block-inserted", block);

        //delete old blocks when I am in light node
        if (this.blockchain.agent !== undefined && this.blockchain.agent.light){

            let index = this.length - consts.BLOCKCHAIN.LIGHT.SAFETY_LAST_BLOCKS_DELETE;
            while (this[index] !== undefined){
                delete this[index];
                index--;
            }

        }

    }

    spliceBlocks(after, freeMemory = false){

        for (let i = this.length - 1; i >= after; i--)
            if (this[i] !== undefined){
                if (freeMemory) {
                    this[i].destroyBlock();
                    delete this[i];
                }
                else
                    this[i] = undefined;
            }

        this.length = after;

        StatusEvents.emit("blockchain/blocks-count-changed", this.length);
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

    recalculateNetworkHashRate(){

        let MaxTarget = new BigNumber("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF");
        let SumDiff = new BigNumber( 0 );

        let how_much_it_took_to_mine_X_Blocks = 0;
        for (let i=this.blockchain.blocks.endingPosition - consts.BLOCKCHAIN.DIFFICULTY.NO_BLOCKS; i<this.blockchain.blocks.endingPosition; i++) {

            if (this.blockchain.blocks[i] === undefined) continue;

            let Diff = MaxTarget.dividedBy( new BigNumber ( "0x"+ this.blockchain.blocks[i].difficultyTarget.toString("hex") ) );
            SumDiff = SumDiff.plus(Diff);

            how_much_it_took_to_mine_X_Blocks += this.blockchain.getTimeStamp(i+1) - this.blockchain.getTimeStamp(i);
        }

        let answer = SumDiff.dividedToIntegerBy(how_much_it_took_to_mine_X_Blocks).toNumber();

        StatusEvents.emit("blockchain/new-network-hash-rate", answer);

        return answer;

    }

}

export default InterfaceBlockchainBlocks;