import NodesList from 'node/lists/nodes-list'
const colors = require('colors/safe');

/**
 * Blockchain Protocol Fork Solver - that solves the fork of a new blockchain
 */
class InterfaceBlockchainProtocolForkSolver{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    async _discoverForkBinarySearch(socket, left, right){
        let mid = (left+right)/2;

        let blockHeader = await socket.node.sendRequestWaitOnce("blockchain/headers/request-block-by-height", {height: mid}, mid);

        //i have finished the binary search

        if (left >= right){
            //it the block actually is the same
            if (blockHeader.hash.equals( this.blockchain.blocks[mid].hash )) return mid;
            else return -1;
        }

        //was not not found, search left because it must be there
        if (! blockHeader.hash.equals ( this.blockchain.blocks[mid].hash )) return this._discoverForkBinarySearch(socket, left, mid-1);
        else
        //was found, search right because the fork must be there
            return this._discoverForkBinarySearch(socket, mid, right);

    }

    /*
        may the fork be with you Otto
     */
    async discoverAndSolveFork(sockets, newChainLength){

        let position;
        let currentBlockchainLength = this.blockchain.getBlockchainLength();

        if (currentBlockchainLength <= newChainLength){

            let answer = await socket.node.sendRequestWaitOnce("blockchain/headers/request-block-by-height", { height: currentBlockchainLength-2 }, currentBlockchainLength-2 );

            if (answer.result === false) {
                let blockHeader = answer.block;

                if (blockHeader.hash.equals( this.blockchain.getBlockchainLastBlock().hash ))
                    position = currentBlockchainLength-2;
            }

        }

        if (position === undefined)
            position = await this._discoverForkBinarySearch(socket, 0, currentBlockchainLength-1);

        //its a fork... starting from position
        if (position > -1){

           let fork = await this.blockchain.forksAdministrator.createNewFork(sockets, position, newChainLength);

           this.solveFork(fork);

           return true;

        }
        //it is a totally new blockchain (maybe genesis was mined)

        return false;

    }

    /**
     * Solve Fork by Downloading  the blocks required in the fork
     * @param fork
     * @returns {Promise.<boolean>}
     */
    async solveFork(fork){

        let nextBlockHeight = fork.forkStartingHeight;

        let finished = false,
            socketsCheckedForBlock = [],
            terminateTimeout;

        while (!finished && (fork.forkBlocks.length < fork.forkHeight - fork.forkStartingHeight) ){

            //set no change, to terminate
            if (terminateTimeout === undefined)
                terminateTimeout = setTimeout(()=>{
                    finished = true;
                }, 3*60*1000);

            let socket = fork.sockets[ Math.floor(Math.random()*fork.sockets.length) ];

            //in case I didn't check this socket for the same block
            if (!socketsCheckedForBlock.indexOf(socket)) {

                socketsCheckedForBlock.push(socket);

                socket.node.sendRequestWaitOnce("blockchain/blocks/request-block-by-height", {height: nextBlockHeight}, nextBlockHeight).then( async (answer)=>{

                    if (answer.result === true){

                        let block = answer.block;
                        let result = await fork.includeForkBlock(block);

                        //if the block was included correctly
                        if (result){
                            clearTimeout(terminateTimeout);
                            terminateTimeout = undefined;
                            nextBlockHeight++;
                        }

                    }

                })
            }

        }

        //just to be sure
        clearTimeout(terminateTimeout);

        if (fork.forkBlocks.length === fork.forkHeight - fork.forkStartingHeight) {

            //if the fork is successfully, the save it as the main blockchain
            if (await fork.saveFork())
                return true;

        }

        return false;

    }

}


export default InterfaceBlockchainProtocolForkSolver;