import NodesList from 'node/lists/nodes-list'
const colors = require('colors/safe');

/**
 * Blockchain Protocol Fork Solver - that solves the fork of a new blockchain
 */
class InterfaceBlockchainProtocolForkSolver{

    constructor(blockchain){

        this.blockchain = blockchain;

    }

    async _discoverForkBinarySearch(sockets, left, right){

        let socket = sockets[0];

        let mid = Math.floor( (left+right)/2 );

        let blockHeaderResult = await socket.node.sendRequestWaitOnce("blockchain/headers/request-block-by-height", {height: mid}, mid);

        if (blockHeaderResult.result  || blockHeaderResult.header === undefined) return { position: -1, header: blockHeaderResult.header };

        //i have finished the binary search
        if (left >= right){
            //it the block actually is the same
            if (blockHeaderResult.header.hash.equals( this.blockchain.blocks[mid].hash )) return {position: mid, header: blockHeaderResult.header };
            else return {position: -1, header: blockHeaderResult.header};
        }

        //was not not found, search left because it must be there
        if (! blockHeaderResult.hash.hash.equals ( this.blockchain.blocks[mid].hash ))
            return this._discoverForkBinarySearch(socket, left, mid-1);
        else
        //was found, search right because the fork must be there
            return this._discoverForkBinarySearch(socket, mid, right);

    }

    /*
        may the fork be with you Otto
     */
    async discoverAndSolveFork(sockets, newChainLength, header){

        if (!Array.isArray(sockets)) sockets = [sockets];

        let forkFound = this.blockchain.forksAdministrator.findForkBySockets(sockets);
        if ( forkFound !== null )
            return forkFound;


        let data = {position: -1, hash: undefined };
        let currentBlockchainLength = this.blockchain.getBlockchainLength();

        //check if n-2 was ok
        if (currentBlockchainLength <= newChainLength && currentBlockchainLength-2  >= 0){

            let answer = await sockets[0].node.sendRequestWaitOnce("blockchain/headers/request-block-by-height", { height: currentBlockchainLength-2 }, currentBlockchainLength-2 );

            console.log("answer", answer);

            if (answer.result === true) {
                let blockHeader = answer.block;

                if (blockHeader.hash.equals( this.blockchain.getBlockchainLastBlock().hash )) {
                    data = {
                        position : currentBlockchainLength - 1,
                        hash: header.hash,
                    };
                }
            }

        }

        if ( (data.position||-1) === -1 ) {
            data = await this._discoverForkBinarySearch(sockets, 0, currentBlockchainLength - 1);
        }

        //its a fork... starting from position
        if (data.position > -1){

           let fork = await this.blockchain.forksAdministrator.createNewFork(sockets, data.position, newChainLength, data.header);

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

        while ( !finished && (fork.forkBlocks.length < fork.forkChainLength - fork.forkStartingHeight) ){

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

        if (fork.forkBlocks.length === fork.forkChainLength - fork.forkStartingHeight) {

            //if the fork is successfully, the save it as the main blockchain
            if (await fork.saveFork())
                return true;

        }

        return false;

    }

}


export default InterfaceBlockchainProtocolForkSolver;