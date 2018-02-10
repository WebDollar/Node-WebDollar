class InterfaceBlockchainProtocolForkManager {

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;

        setInterval(this.processForks, 20 );

    }

    async processForks(){

    }

    /*
        may the fork be with you Otto
     */
    async discoverNewForkTip(socket, newChainLength){

        if (typeof newChainLength !== "number") throw "newChainLength is not a number";

        let fork, result = null;
        let currentBlockchainLength = this.blockchain.getBlockchainLength;

        let processingSocket = this.blockchain.forksAdministrator.getSocketProcessing(socket);

        if (processingSocket !== null) {
            this.blockchain.forksAdministrator.updateSocketProcessingNewForkLength(processingSocket, newChainLength);
            return false;
        }

        try{

            processingSocket =  this.blockchain.forksAdministrator.addSocketProcessing(socket);


            let forkFound = this.blockchain.forksAdministrator.findForkBySockets(socket);
            if ( forkFound !== null ) return forkFound;

            //check if n-2 was ok, but I need at least 1 block
            if (currentBlockchainLength === newChainLength-1 && currentBlockchainLength-2  >= 0 && currentBlockchainLength > 0){

                let answer = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", { height: currentBlockchainLength-1 }, currentBlockchainLength-1 );

                if (answer === null || answer === undefined) throw "connection dropped headers-info";
                if (answer.result !== true || answer.header === undefined || !Buffer.isBuffer(answer.header.hash) ) throw "connection headers-info malformed";

                if (answer.header.hash.equals( this.blockchain.last.hash ))

                    binarySearchResult = {
                        position : currentBlockchainLength,
                        header: answer.header,
                    };


            }

            // in case it was you solved previously && there is something in the blockchain

            console.log(colors.yellow("discoverFork 555" ), binarySearchResult)

            if ( binarySearchResult.position === -1 ) {

                let answer = await socket.node.sendRequestWaitOnce("blockchain/info/request-blockchain-info", { } );

                if (answer === null) throw "connection dropped info";
                if (answer === undefined || answer === undefined || typeof answer.chainStartingPoint !== "number" ) throw "request-blockchain-info couldn't return real values";

                newChainStartingPoint = answer.chainStartingPoint;

                console.log(colors.yellow("discoverFork 6666" + newChainStartingPoint))

                binarySearchResult = await this._calculateForkBinarySearch(socket, newChainStartingPoint, newChainLength, currentBlockchainLength );

                if (binarySearchResult.position === null)
                    throw "connection dropped discoverForkBinarySearch"

                //console.log("binary search ", binarySearchResult)
            }

            console.log(colors.yellow("discoverFork 7777" ), binarySearchResult)

            // it has a ground-new blockchain
            // very skeptical when the blockchain becomes bigger

            // probably for mini-blockchain light
            if (binarySearchResult.position === -1 && currentBlockchainLength < newChainLength){

                let answer = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", { height: newChainStartingPoint }, newChainStartingPoint );

                if (answer === null || answer === undefined ) throw "connection dropped headers-info newChainStartingPoint";
                if (answer.result !== true || answer.header === undefined) throw "headers-info 0 malformed"

                binarySearchResult = {position: newChainStartingPoint, header: answer.header};

            }

            //its a fork... starting from position
            console.log("fork position", binarySearchResult.position, "newChainStartingPoint", newChainStartingPoint, "newChainLength", newChainLength);

            if (binarySearchResult.position === -1 || (binarySearchResult.position > 0 && binarySearchResult.header !== undefined && binarySearchResult.header !== null) ){

                try {

                    //let check again
                    forkFound = this.blockchain.forksAdministrator.findForkBySockets(socket);
                    if ( forkFound !== null ) return forkFound;

                    fork = await this.blockchain.forksAdministrator.createNewFork(socket, binarySearchResult.position, newChainStartingPoint, newChainLength, binarySearchResult.header);


                } catch (Exception){

                    console.log(colors.red("discoverAndProcessFork - creating a fork raised an exception" ), Exception, "binarySearchResult", binarySearchResult )
                    throw Exception;
                }

                try{


                    if (fork !== null) {
                        console.log("solveFork1");
                        result = await this.solveFork(fork);
                    }


                } catch (Exception){

                    console.log(colors.red("discoverAndProcessFork - solving a fork raised an exception" ), Exception, "binarySearchResult", binarySearchResult );
                    throw Exception;
                }


                if (fork === null) {
                    console.log("fork is null");
                }


            } else
            //it is a totally new blockchain (maybe genesis was mined)
                console.log("fork is something new");

        } catch (Exception){

            console.log(colors.red("discoverAndProcessFork raised an exception"  ), Exception )

        }

        this.blockchain.forksAdministrator.deleteFork(fork);
        this.blockchain.forksAdministrator.deleteSocketProcessing(socket);

        if (processingSocket.forkChainLengthToDo !== -1 &&  processingSocket.forkChainLengthToDo > newChainLength )
            this.discoverAndProcessFork(socket, processingSocket.forkChainLengthToDo );

        return result;

    }


}

export default InterfaceBlockchainProtocolForkManager;