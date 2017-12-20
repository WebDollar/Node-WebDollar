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

        let blockHeaderResult;

        try {

            let socket = sockets[0];

            let mid = Math.trunc((left + right) / 2);

            blockHeaderResult = await socket.node.sendRequestWaitOnce("blockchain/headers/request-block-by-height", {height: mid}, mid);

            if (!blockHeaderResult.result || blockHeaderResult.header === undefined) return {position: -1, header: blockHeaderResult.header};

            //i have finished the binary search
            if (left >= right) {
                //it the block actually is the same
                if (blockHeaderResult.header.hash.equals(this.blockchain.blocks[mid].hash) === false)
                    return {position: mid, header: blockHeaderResult.header};
                else
                    return {position: -1, header: blockHeaderResult.header};
            }

            //was not not found, search left because it must be there
            if (blockHeaderResult.header.hash.equals(this.blockchain.blocks[mid].hash) === false)
                return this._discoverForkBinarySearch(socket, left, mid);
            else
            //was found, search right because the fork must be there
                return this._discoverForkBinarySearch(socket, mid + 1, right);


        } catch (Exception){

            console.log(colors.red("_discoverForkBinarySearch raised an exception" + Exception.toString() ), blockHeaderResult)

        }

    }

    /*
        may the fork be with you Otto
     */
    async discoverAndSolveFork(sockets, newChainLength, header){

        if (!Array.isArray(sockets)) sockets = [sockets];

        let forkFound = this.blockchain.forksAdministrator.findForkBySockets(sockets);
        if ( forkFound !== null )
            return forkFound;


        let data = {position: -1, header: undefined };
        let currentBlockchainLength = this.blockchain.getBlockchainLength();

        //check if n-2 was ok, but I need at least 1 block
        if (currentBlockchainLength <= newChainLength && currentBlockchainLength-2  >= 0 && currentBlockchainLength > 0){

            let answer = await sockets[0].node.sendRequestWaitOnce("blockchain/headers/request-block-by-height", { height: currentBlockchainLength-2 }, currentBlockchainLength-2 );

            console.log(" !!!! answer", answer);

            if (answer.result === true && answer.header !== undefined) {

                if (answer.header.hash.equals( this.blockchain.getBlockchainLastBlock().hash )) {
                    data = {
                        position : currentBlockchainLength - 1,
                        hash: answer.header.hash,
                    };
                }
            }

        }

        // in case it was you solved previously && there is something in the blockchain

        if ( (data.position||-1) === -1 && currentBlockchainLength > 0 ) {
            data = await this._discoverForkBinarySearch(sockets, 0, currentBlockchainLength - 1);
        }

        //it is a full fork
        if (currentBlockchainLength === 0 && data.position === -1)
            data = {position : 0, header: undefined};

        //its a fork... starting from position
        console.log("fork position", data.position, "newChainLength", newChainLength);

        if (data.position > -1 ){

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
                    console.log(colors.red("Fork was not solved in time..."));
                    finished = true;
                }, 20*1000);

            let socket = fork.sockets[ Math.floor(Math.random()*fork.sockets.length) ];

            //console.log("processsing... fork.sockets.length ", fork.sockets.length);

            //in case I didn't check this socket for the same block
            if ( socketsCheckedForBlock.indexOf(socket) < 0) {

                //console.log("it worked ", socket);

                socketsCheckedForBlock.push(socket);
                console.log("nextBlockHeight", nextBlockHeight);

                socket.node.sendRequestWaitOnce("blockchain/blocks/request-block-by-height", { height: nextBlockHeight }, nextBlockHeight).then( async (answer)=>{

                    if (answer.result === true){

                        let block = answer.block;
                        let result = await fork.includeForkBlock(block);

                        //if the block was included correctly
                        if (result) {
                            clearTimeout(terminateTimeout);
                            terminateTimeout = undefined;
                            nextBlockHeight++;

                            socketsCheckedForBlock = [];
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