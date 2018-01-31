import InterfaceBlockchainFork from "../blockchain/forks/Interface-Blockchain-Fork";
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
const colors = require('colors/safe');

/**
 * Blockchain Protocol Fork Solver - that solves the fork of a new blockchain
 */
class InterfaceBlockchainProtocolForkSolver{

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;

    }

    async _discoverForkBinarySearch(socket, left, right){

        let blockHeaderResult;

        try {

            let mid = Math.trunc((left + right) / 2);

            console.log("_discoverForkBinarySearch", left, right, 1111)
            blockHeaderResult = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", {height: mid}, mid);
            console.log("_discoverForkBinarySearch", left, right, 2222)

            if (blockHeaderResult === null || blockHeaderResult === undefined || blockHeaderResult.result !== true || blockHeaderResult.header === undefined || blockHeaderResult.header.hash === undefined ||  !Buffer.isBuffer(blockHeaderResult.header.hash) )
                return {position: null, header: (blockHeaderResult === null ? null : blockHeaderResult.header) };

            //i have finished the binary search
            if (left >= right) {
                //it the block actually is the same
                if (blockHeaderResult.header.hash.equals(this.blockchain.blocks[mid].hash) )
                    return {position: mid, header: blockHeaderResult.header};
                else
                    return {position: -1, header: blockHeaderResult.header};
            }

            //was not not found, search left because it must be there
            if (blockHeaderResult.header.hash.equals(this.blockchain.blocks[mid].hash) === false)
                return await this._discoverForkBinarySearch(socket, left, mid);
            else
            //was found, search right because the fork must be there
                return await this._discoverForkBinarySearch(socket, mid + 1, right);


        } catch (Exception){

            console.log(colors.red("_discoverForkBinarySearch raised an exception" ), Exception);

            return {position: null, header: null};
        }

    }

    /*
        may the fork be with you Otto
     */
    async discoverAndSolveFork(socket, newChainLength){

        let fork, result = null;
        let data = {position: -1, header: null };
        let currentBlockchainLength = this.blockchain.getBlockchainLength();

        try{

            if (this.blockchain.forksAdministrator.findSocketProcessing(socket) !== null)
                return false;

            this.blockchain.forksAdministrator.addSocketProcessing(socket);

            console.log(colors.yellow("ForkSolver ------ 111"))

            let forkFound = this.blockchain.forksAdministrator.findForkBySockets(socket);
            if ( forkFound !== null ) return forkFound;

            console.log(colors.yellow("ForkSolver ------ 222"))
            //check if n-2 was ok, but I need at least 1 block
            if (currentBlockchainLength <= newChainLength && currentBlockchainLength-2  >= 0 && currentBlockchainLength > 0){

                console.log(colors.yellow("ForkSolver ------ 333"))
                let answer = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", { height: currentBlockchainLength-2 }, currentBlockchainLength-2 );
                console.log(colors.yellow("ForkSolver ------ 444"))
                if (answer === null)
                    throw "connection dropped headers-info";

                if (answer !== undefined && answer !== null && answer.result === true && answer.header !== undefined && Buffer.isBuffer(answer.header.hash) )

                    if (answer.header.hash.equals( this.blockchain.getBlockchainLastBlock().hash ))

                        data = {
                            position : currentBlockchainLength - 1,
                            header: answer.header,
                        };

                console.log(colors.yellow("ForkSolver ------ 555"))

            }

            // in case it was you solved previously && there is something in the blockchain

            if ( data.position === -1 && currentBlockchainLength > 0 ) {

                console.log(colors.yellow("ForkSolver ------ 6666"));
                let answer = await socket.node.sendRequestWaitOnce("blockchain/info/request-blockchain-info", { } );
                console.log(colors.yellow("ForkSolver ------ 777"));

                if (answer === null)
                    throw "connection dropped info";

                if (answer === undefined || answer === undefined || typeof answer.chaingStartingPoint !== "number" )
                    throw "request-blockchain-info couldn't return real values";

                console.log(colors.yellow("ForkSolver ------ 888"));
                data = await this._discoverForkBinarySearch(socket, answer.chaingStartingPoint, currentBlockchainLength - 1);

                console.log(colors.yellow("ForkSolver ------ 9999"));
                if (data.position === null)
                    throw "connection dropped discoverForkBinarySearch"

                //console.log("binary search ", data)
            }

            // it has a ground-new blockchain
            // very skeptical when the blockchain becomes bigger
            if (data.position === -1 && currentBlockchainLength < newChainLength){

                let answer = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", { height: 0 }, 0 );

                if (answer === null)
                    throw "connection dropped headers-info 0";

                if (answer !== null && answer !== undefined && answer.result === true && answer.header !== undefined)
                    data = {position: 0, header: answer.header};

            }

            //its a fork... starting from position
            console.log("fork position", data.position, "newChainLength", newChainLength);

            if (data.position === 0 || (data.position > 0 && data.header !== undefined && data.header !== null) ){

                try {

                    console.log(colors.yellow("ForkSolver ------ 1010"));
                    //let check again
                    forkFound = this.blockchain.forksAdministrator.findForkBySockets(socket);
                    if ( forkFound !== null ) return forkFound;

                    console.log(colors.yellow("ForkSolver ------ 1111"));
                    fork = await this.blockchain.forksAdministrator.createNewFork(socket, data.position, newChainLength, data.header);

                    console.log(colors.yellow("ForkSolver ------ 1212"));

                } catch (Exception){

                    console.log(colors.red("discoverAndSolveFork - creating a fork raised an exception" ), Exception, "data", data )
                    throw Exception;
                }

                try{

                    // for (let i=0; i<100; i++)
                    //     console.log(colors.green("forks " + this.blockchain.forksAdministrator.forks.length) );

                    if (fork !== null) {
                        console.log("solveFork1");
                        console.log(colors.yellow("ForkSolver ------ 1313"));
                        result = await this.solveFork(fork);
                        console.log(colors.yellow("ForkSolver ------ 1414"));
                    }


                } catch (Exception){

                    console.log(colors.red("discoverAndSolveFork - solving a fork raised an exception" + Exception.toString() ), "data", data );
                    throw Exception;
                }


                if (fork === null) {
                    console.log("fork is null");
                }


            } else
                //it is a totally new blockchain (maybe genesis was mined)
                console.log("fork is something new");

        } catch (Exception){

            console.log(colors.red("discoverAndSolveFork raised an exception"  ), Exception )

        }

        this.blockchain.forksAdministrator.deleteSocketProcessing(socket);
        this.blockchain.forksAdministrator.deleteFork(fork);
        return result;
    }

    /**
     * Solve Fork by Downloading  the blocks required in the fork
     * @param fork
     * @returns {Promise.<boolean>}
     */
    async solveFork(fork) {

        if (fork === null || fork === undefined || !(fork instanceof InterfaceBlockchainFork)) throw ('fork is null');

        let nextBlockHeight = fork.forkStartingHeight;


        //interval timer

        return new Promise(async (resolve) => {

            try{

                let socket = fork.sockets[Math.floor(Math.random() * fork.sockets.length)];

                //console.log("processsing... fork.sockets.length ", fork.sockets.length);

                let answer = null;

                //in case I didn't check this socket for the same block
                while (fork.forkStartingHeight + fork.forkBlocks.length < fork.forkChainLength ) {


                    // TODO you can paralize the downloading code from multiple sockets

                    console.log("nextBlockHeight", nextBlockHeight);

                    let answer;

                    //console.log("this.protocol.acceptBlocks", this.protocol.acceptBlocks);

                    let onlyHeader;
                    if (this.protocol.acceptBlocks) onlyHeader = false;
                    else if (this.protocol.acceptBlockHeaders) onlyHeader = true;


                    console.log(colors.yellow("ForkSolver ------ 6161 ********"));
                    answer = await socket.node.sendRequestWaitOnce("blockchain/blocks/request-block-by-height", {height: nextBlockHeight, onlyHeader: onlyHeader}, nextBlockHeight);
                    console.log(colors.yellow("ForkSolver ------ 6262"));

                    if (answer === null)
                        throw "block never received "+ nextBlockHeight;

                    if (answer !== undefined && answer !== null && answer.result === true && answer.block !== undefined  && Buffer.isBuffer(answer.block) ) {

                        let block;

                        try {

                            console.log(colors.yellow("ForkSolver ------ 6363"));
                            block = this.blockchain.blockCreator.createEmptyBlock(nextBlockHeight);

                            if (!this.protocol.acceptBlocks && this.protocol.acceptBlockHeaders)
                                block.data._onlyHeader = true; //avoiding to store the transactions

                            console.log(colors.yellow("ForkSolver ------ 6464"));
                            block.deserializeBlock( answer.block, nextBlockHeight, BlockchainMiningReward.getReward(block.height), new Buffer(32) );
                            console.log(colors.yellow("ForkSolver ------ 6565"));

                        } catch (Exception) {
                            console.log(colors.red("Error deserializing blocks "), Exception, answer.block);
                            resolve(false);
                            return false;
                        }

                        let result;

                        try {

                            console.log(colors.yellow("ForkSolver ------ 6655"));
                            result = await fork.includeForkBlock(block);
                            console.log(colors.yellow("ForkSolver ------ 6666"));

                        } catch (Exception) {

                            console.log(colors.red("Error including block " + nextBlockHeight + " in fork "), Exception);

                            try {
                                console.log("block.serialization ", block.serializeBlock().toString("hex"));
                            } catch (exception) {
                                console.log(colors.red("Error serializing fork block"), block);
                            }

                            resolve(false);
                            return false;

                        }

                        //if the block was included correctly
                        if (result) {

                            nextBlockHeight++;
                        }

                    }


                }

                if (fork.forkStartingHeight + fork.forkBlocks.length >= fork.forkChainLength ) {

                    if (await fork.saveFork()) {
                        resolve(true);
                        return true;
                    } else {
                        resolve(false);
                        return false;
                    }

                }


            } catch (exception){

                console.log("solveFork raised an exception", exception);
                resolve(false);
                return false;


            }




        });
    }

}


export default InterfaceBlockchainProtocolForkSolver;