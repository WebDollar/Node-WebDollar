import InterfaceBlockchainFork from "../blockchain/forks/Interface-Blockchain-Fork";
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import global from "consts/global"
import consts from 'consts/const_global'
import StatusEvents from "common/events/Status-Events"

/**
 * Blockchain Protocol Fork Solver - that solves the fork of a new blockchain
 */
class InterfaceBlockchainProtocolForkSolver{

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;

    }

    async _discoverForkBinarySearch(socket, initialLeft, left, right){

        let blockHeaderResult;

        try {

            let mid = Math.trunc((left + right) / 2);

            console.log("_discoverForkBinarySearch", initialLeft, left, right, 1111);
            blockHeaderResult = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", {height: mid}, mid);

            if (left < 0 || blockHeaderResult === null || blockHeaderResult === undefined || blockHeaderResult.result !== true || blockHeaderResult.header === undefined || blockHeaderResult.header === null || blockHeaderResult.header.hash === undefined ||  !Buffer.isBuffer(blockHeaderResult.header.hash) )
                return {position: null, header: (blockHeaderResult === null ? null : blockHeaderResult.header) };

            //i have finished the binary search
            if (left >= right) {
                //it the block actually is the same
                if (blockHeaderResult.header.hash.equals( this.blockchain.getHashPrev(mid+1) ) )
                    return {position: mid, header: blockHeaderResult.header};
                else {

                    //it is not a match, but it was previously a match
                    if (mid-1 >= 0 && initialLeft <= mid-1 && initialLeft < left){

                        blockHeaderResult = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", {height: mid-1}, mid-1);
                        if ( blockHeaderResult !== null && blockHeaderResult !== undefined && blockHeaderResult.result && blockHeaderResult.header !== undefined && blockHeaderResult.header !== null && blockHeaderResult.header.hash !== undefined && Buffer.isBuffer(blockHeaderResult.header.hash) )
                            if (blockHeaderResult.header.hash.equals( this.blockchain.getHashPrev(mid-1 +1) ) )
                                return {position: mid-1, header: blockHeaderResult.header};
                    }
                    return {position: -1, header: blockHeaderResult.header};
                }
            }

            //was not not found, search left because it must be there
            if (blockHeaderResult.header.hash.equals( this.blockchain.getHashPrev(mid+1)  ) === false)
                return await this._discoverForkBinarySearch(socket, initialLeft, left, mid);
            else
            //was found, search right because the fork must be there
                return await this._discoverForkBinarySearch(socket, initialLeft, mid + 1, right);


        } catch (Exception){

            console.error("_discoverForkBinarySearch raised an exception" , Exception, blockHeaderResult);

            return {position: null, header: null};
        }

    }

    async _calculateForkBinarySearch(socket, newChainStartingPoint, newChainLength, currentBlockchainLength){

        if (newChainStartingPoint > currentBlockchainLength-1 || currentBlockchainLength === 0)
            return {position: -1, header: null};
        else {
            let binarySearchResult = await this._discoverForkBinarySearch(socket, newChainStartingPoint, newChainStartingPoint, currentBlockchainLength - 1);

            //forcing the binary search for download the next unmatching element
            if (binarySearchResult.position !== -1 && binarySearchResult.position+1 < newChainLength)
                binarySearchResult.position++;

            return binarySearchResult;
        }

    }

    /*
        may the fork be with you Otto
     */
    async discoverAndProcessFork(tip){

        let fork, result = null, newChainStartingPoint = 0;
        let binarySearchResult = {position: -1, header: null };
        let currentBlockchainLength = this.blockchain.blocks.length;

        let socket = tip.socket;
        let newChainLength = tip.forkChainLength;

        try{

            if (currentBlockchainLength > newChainLength)
                throw {message: "discoverAndProcessFork a smaller fork than I have"};

            let forkFound = this.blockchain.forksAdministrator.findForkBySockets(socket);

            if ( forkFound !== null ) {
                console.error("discoverAndProcessFork - fork already found");
                return forkFound;
            }

            //check if n-2 was ok, but I need at least 1 block
            if (currentBlockchainLength === newChainLength-1 && currentBlockchainLength-2  >= 0 && currentBlockchainLength > 0){

                let answer = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", { height: currentBlockchainLength-1 }, currentBlockchainLength-1 );

                if (answer === null || answer === undefined)
                    throw {message: "connection dropped headers-info"};
                if (answer.result !== true || answer.header === undefined || !Buffer.isBuffer(answer.header.hash) )
                    throw {message: "connection headers-info malformed"};

                if (answer.header.hash.equals( this.blockchain.last.hash ))

                    binarySearchResult = {
                        position : currentBlockchainLength,
                        header: answer.header,
                    };


            }

            // in case it was you solved previously && there is something in the blockchain

            console.warn("discoverFork 555" , binarySearchResult);

            if ( binarySearchResult.position === -1 ) {

                let answer = await socket.node.sendRequestWaitOnce("blockchain/info/request-blockchain-info", { } );

                if (answer === null) throw {message: "connection dropped info"};
                if (answer === undefined || typeof answer.chainStartingPoint !== "number" )
                    throw {message: "request-blockchain-info couldn't return real values"};

                newChainStartingPoint = answer.chainStartingPoint;

                if (this.blockchain.agent.light)
                    if (newChainLength - newChainStartingPoint > consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS){
                        console.warn("LIGHT CHANGES from ", newChainStartingPoint, " to ", newChainLength - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 1);
                        newChainStartingPoint = newChainLength - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 1;
                    }

                console.warn("discoverFork 6666" + newChainStartingPoint)

                binarySearchResult = await this._calculateForkBinarySearch(socket, newChainStartingPoint, newChainLength, currentBlockchainLength );

                if (binarySearchResult.position === null)
                    throw {message: "connection dropped discoverForkBinarySearch"}

                // console.log("binary search ", binarySearchResult)
            }

            console.warn("discoverFork 7777" , binarySearchResult);

            // it has a ground-new blockchain
            // very skeptical when the blockchain becomes bigger

            // probably for mini-blockchain light
            if (binarySearchResult.position === -1 && currentBlockchainLength < newChainLength){

                let answer = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", { height: newChainStartingPoint }, newChainStartingPoint );

                if (answer === null || answer === undefined )
                    throw {message: "connection dropped headers-info newChainStartingPoint"};
                if (answer.result !== true || answer.header === undefined)
                    throw {message: "headers-info 0 malformed"}

                binarySearchResult = {position: newChainStartingPoint, header: answer.header};

            }

            //its a fork... starting from position
            console.log("fork position", binarySearchResult.position, "newChainStartingPoint", newChainStartingPoint, "newChainLength", newChainLength);

            if (binarySearchResult.position === -1 || (binarySearchResult.position > 0 && binarySearchResult.header !== undefined && binarySearchResult.header !== null) ){

                try {

                    //let check again
                    forkFound = this.blockchain.forksAdministrator.findForkBySockets(socket);
                    if ( forkFound !== null )
                        return forkFound;

                    fork = await this.blockchain.forksAdministrator.createNewFork(socket, binarySearchResult.position, newChainStartingPoint, newChainLength, binarySearchResult.header);


                } catch (Exception){

                    console.error("discoverAndProcessFork - creating a fork raised an exception" , Exception, "binarySearchResult", binarySearchResult )
                    throw Exception;
                }

                try{


                    if (fork !== null) {
                        console.log("solveFork1");
                        result = await this.solveFork(fork);
                    }


                } catch (Exception){

                    console.error("solving a fork raised an exception" , Exception, "binarySearchResult", binarySearchResult );
                    throw Exception;
                }


                if (fork === null) {
                    console.log("fork is null");
                }


            } else
                //it is a totally new blockchain (maybe genesis was mined)
                console.log("fork is something new");

        } catch (Exception){

            console.error("discoverAndProcessFork raised an exception", Exception );
            result = false;

        }

        this.blockchain.forksAdministrator.deleteFork(fork);

        return result;
    }


    /**
     * Solve Fork by Downloading  the blocks required in the fork
     * @param fork
     * @returns {Promise.<boolean>}
     */
    async solveFork(fork) {

        if (fork === null || fork === undefined || typeof fork !== "object" )
            throw ('fork is null');

        let nextBlockHeight = fork.forkStartingHeightDownloading;


        //interval timer

        try{

            let socket = fork.sockets[Math.floor(Math.random() * fork.sockets.length)];

            console.log(" < fork.forkChainLength", fork.forkChainLength, "fork.forkBlocks.length", fork.forkBlocks.length);

            while (fork.forkStartingHeight + fork.forkBlocks.length < fork.forkChainLength && !global.TERMINATED ) {


                // TODO you can paralyze the downloading code from multiple sockets

                console.log("nextBlockHeight", nextBlockHeight);

                if (nextBlockHeight % 2 === 0)
                    StatusEvents.emit( "agent/status", {message: "Synchronizing - Downloading Block", blockHeight: nextBlockHeight, blockHeightMax: fork.forkChainLength } );

                //console.log("this.protocol.acceptBlocks", this.protocol.acceptBlocks);

                let onlyHeader;
                if (this.protocol.acceptBlocks)
                    onlyHeader = false;
                else
                if (this.protocol.acceptBlockHeaders)
                    onlyHeader = true;


                let answer = await socket.node.sendRequestWaitOnce("blockchain/blocks/request-block-by-height", { height: nextBlockHeight }, nextBlockHeight);

                if (answer === null || answer === undefined)
                    throw {message: "block never received "+ nextBlockHeight};

                if ( !answer.result || answer.block === undefined  || !Buffer.isBuffer(answer.block) ) {
                    console.log("Fork Answer received ", answer);
                    throw {message: "Fork Answer is not Buffer"};
                }


                let blockValidation = fork._createBlockValidation_ForkValidation(nextBlockHeight, fork.forkBlocks.length-1);
                let block = this._deserializeForkBlock(answer.block, nextBlockHeight, blockValidation );

                let result;

                try {

                    result = await fork.includeForkBlock(block);

                } catch (Exception) {

                    console.error("Error including block " + nextBlockHeight + " in fork ", Exception);

                    try {
                        console.log("block.serialization ", block.serializeBlock().toString("hex"));
                    } catch (exception) {
                        console.error("Error serializing fork block", block);
                    }

                    return false;

                }

                //if the block was included correctly
                if (result)
                    nextBlockHeight++;
                else
                    throw {message: "Fork didn't work at height ", nextBlockHeight};

            }

            if (fork.forkStartingHeight + fork.forkBlocks.length >= fork.forkChainLength ) {

                if (await fork.saveFork())
                    return true;
                else
                    return false;

            }


        } catch (exception){

            console.log("solveFork raised an exception", exception);
            return false;


        }

    }

    _deserializeForkBlock( blockData, blockHeight, validationBlock){

        let block = undefined;

        try {

            block = this.blockchain.blockCreator.createEmptyBlock(blockHeight, validationBlock);

            if (!this.protocol.acceptBlocks && this.protocol.acceptBlockHeaders)
                block.data._onlyHeader = true; //avoiding to store the transactions

            block.deserializeBlock( blockData, blockHeight, BlockchainMiningReward.getReward(block.height), new Buffer(32) );

        } catch (Exception) {
            console.error("Error deserializing blocks ", Exception, blockData);
            return false;
        }

        return block;
    }

}


export default InterfaceBlockchainProtocolForkSolver;