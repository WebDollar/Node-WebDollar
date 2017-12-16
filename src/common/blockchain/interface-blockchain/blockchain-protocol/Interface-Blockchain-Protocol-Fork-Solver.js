import NodesList from 'node/lists/nodes-list'
const colors = require('colors/safe');

/**
 * Blockchain Protocol Fork Solver - that solves the fork of a new blockchain
 */
class InterfaceBlockchainProtocolForkSolver{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    async discoverForkBinarySearch(socket, left, right){
        let mid = (left+right)/2;

        let blockHeader = await socket.sendRequestWaitOnce("blockchain/headers/request-block-by-height", {height: mid}, mid);

        //i have finished the binary search

        if (left >= right){
            //it the block actually is the same
            if (blockHeader.hash.equals( this.blockchain.blocks[mid] )) return mid;
            else return -1;
        }

        //if the element is not found, search left because it must be there
        if (! blockHeader.hash.equals ( this.blockchain.blocks[mid] )) return this.discoverForkBinarySearch(socket, left, mid-1);
        else return this.discoverForkBinarySearch(socket, mid, right);

    }

    async discoverFork(socket){

        let position = await this.discoverForkBinarySearch(socket, 0, this.blockchain.length-1);

        //its a fork... starting from position
        if (position > -1){

        }
        //it is a totally new blockchain (maybe genesis was mined)

    }

}


export default InterfaceBlockchainProtocolForkSolver;