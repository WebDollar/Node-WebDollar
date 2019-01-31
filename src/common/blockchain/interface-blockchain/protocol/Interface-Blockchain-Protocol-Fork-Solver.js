import InterfaceBlockchainFork from "../blockchain/forks/Interface-Blockchain-Fork";
import BlockchainMiningReward from 'common/blockchain/global/Blockchain-Mining-Reward'
import global from "consts/global"
import consts from 'consts/const_global'
import StatusEvents from "common/events/Status-Events"
import BufferExtended from "common/utils/BufferExtended";
import BansList from "common/utils/bans/BansList"

/**
 * Blockchain Protocol Fork Solver - that solves the fork of a new blockchain
 */
class InterfaceBlockchainProtocolForkSolver{

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;

        this.curentIterationsDownloaded = 0;

    }

    async _discoverForkBinarySearch(socket, initialLeft, left, right){

        let answer;

        try {

            let mid = Math.trunc((left + right) / 2);

            answer = await socket.node.sendRequestWaitOnce("head/chainHash", mid, mid, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT);

            console.log("_discoverForkBinarySearch", initialLeft, "left", left, "right ", right, (answer && answer.hash) ? answer.hash.toString("hex") : 'no remote hash', "my chain hash", this.blockchain.getChainHash( mid + 1 ).toString("hex" ) );

            if (left < 0 || !answer || !Buffer.isBuffer(answer.hash) ) // timeout
                return {position: null, header: answer };

            //i have finished the binary search
            if (left >= right) {

                //it the block actually is the same
                if (answer.hash.equals( this.blockchain.getChainHash( mid + 2 ) ) )
                    return {position: mid, header: answer.hash };
                else {

                    //it is not a match, but it was previously a match
                    if (mid-1 >= 0 && initialLeft <= mid-1 && initialLeft < left){

                        answer = await socket.node.sendRequestWaitOnce("head/chainHash", mid-1, mid-1, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT );

                        if ( !answer || !Buffer.isBuffer(answer.hash))
                            return {position: null, header: answer }; // timeout

                        if (answer.hash.equals( this.blockchain.getChainHash(mid -1 + 2 ) ) ) // it is a match
                            return {position: mid-1, header: answer.hash };

                    }

                    return {position: -1, header: answer.hash}
                }

            }

            console.log("it is comparing", answer.hash.toString("hex"), this.blockchain.getChainHash(mid + 1).toString("hex"));

            //was not not found, search left because it must be there
            if (! answer.hash.equals( this.blockchain.getChainHash(mid + 2)  ) )
                return await this._discoverForkBinarySearch(socket, initialLeft, left, mid);
            else
            //was found, search right because the fork must be there
                return await this._discoverForkBinarySearch(socket, initialLeft, mid + 1, right);

        } catch (exception){

            console.error("_discoverForkBinarySearch raised an exception" , exception, answer);

            return {position: null, header: null};

        }

    }

    async _calculateForkBinarySearch(socket, forkChainStartingPoint, forkChainLength, currentBlockchainLength){

        if (forkChainStartingPoint > currentBlockchainLength-1 || currentBlockchainLength === 0)
            return {position: -1, header: null};
        else {
            let binarySearchResult = await this._discoverForkBinarySearch(socket, forkChainStartingPoint, forkChainStartingPoint, currentBlockchainLength - 1);

            //forcing the binary search for download the next unmatching element
            if (binarySearchResult.position !== -1 && binarySearchResult.position+1 < forkChainLength)
                binarySearchResult.position++;

            return binarySearchResult;
        }



    }


    /*
        may the fork be with you Otto
     */

    async discoverFork(socket, forkChainLength, forkChainStartingPoint, forkLastChainHash, forkProof, forkChainWork ){

        let binarySearchResult = {position: -1, header: null };
        let currentBlockchainLength = this.blockchain.blocks.length;

        let fork, forkFound;

        try {

            let answer = this.blockchain.forksAdministrator.findFork(socket, forkLastChainHash, forkProof);
            if (answer !== null) return answer;

            fork = await this.blockchain.forksAdministrator.createNewFork( socket, undefined, undefined, undefined, undefined, [ forkLastChainHash ], false );

            //veify last n elements
            const count = 6;

            if ( currentBlockchainLength >= count && ( forkChainLength >= currentBlockchainLength ||  (this.blockchain.agent.light && forkProof) )  )
                for (let i = currentBlockchainLength-1; i >= currentBlockchainLength-1-count; i--){

                    if (i === forkChainLength-1 && forkLastChainHash && forkLastChainHash ) {
                        answer = { hash: forkLastChainHash };
                    } else {
                        answer = await socket.node.sendRequestWaitOnce( "head/chainHash", i, i, consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT );
                        if (!answer || !answer.hash )
                            continue;
                    }

                    forkFound = this.blockchain.forksAdministrator._findForkyByHeader( answer.hash );

                    if (forkFound !== null && forkFound !== fork) {
                        if (Math.random() < 0.01) console.error("discoverAndProcessFork - fork already found by n-2");

                        forkFound.pushHeaders( fork.forkHeaders ); //this lead to a new fork
                        forkFound.pushSocket(socket, forkProof);

                        this.blockchain.forksAdministrator.deleteFork(fork); //destroy fork

                        return {result: true, fork: forkFound};
                    }

                    fork.pushHeader(answer.hash);

                    if (this.blockchain.blocks[i].calculateNewChainHash().equals(answer.hash)){

                        binarySearchResult = {
                            position: (i === currentBlockchainLength-1)  ? currentBlockchainLength :  i+1,
                            header: answer.hash,
                        };


                        break;

                    }

                }


            // in case it was you solved previously && there is something in the blockchain

            //Binary Search to detect the Fork Position
            if ( binarySearchResult.position === -1 ) {

                if (this.blockchain.agent.light) {
                    if (forkChainLength - forkChainStartingPoint > consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS) {
                        console.warn("LIGHT CHANGES from ", forkChainStartingPoint, " to ", forkChainLength - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 1);
                        forkChainStartingPoint = forkChainLength - consts.BLOCKCHAIN.LIGHT.VALIDATE_LAST_BLOCKS - 1;
                    }
                }

                console.warn("discoverFork 6666" + forkChainStartingPoint);

                binarySearchResult = await this._calculateForkBinarySearch(socket, forkChainStartingPoint, forkChainLength, currentBlockchainLength );

                if (binarySearchResult.position === null)
                    throw {message: "connection dropped discoverForkBinarySearch"};

                forkFound = this.blockchain.forksAdministrator._findForkyByHeader(binarySearchResult.header);

                if ( forkFound !== null && forkFound !== fork ){

                    if (Math.random() < 0.01) console.error("discoverAndProcessFork - fork already found by hash after binary search");

                    forkFound.pushHeader( forkLastChainHash );
                    forkFound.pushSocket( socket, forkProof );

                    this.blockchain.forksAdministrator.deleteFork(fork); //destroy fork

                    return {result: true, fork: forkFound};
                }

                fork.pushHeader(binarySearchResult.header);

            }

            //process light and NiPoPow
            await this.optionalProcess(socket, binarySearchResult, currentBlockchainLength, forkChainLength, forkChainStartingPoint);

            //its a fork... starting from position
            console.log("fork position", binarySearchResult.position, "forkChainStartingPoint", forkChainStartingPoint, "forkChainLength", forkChainLength);

            if (binarySearchResult.position === -1 || (binarySearchResult.position > 0 && binarySearchResult.header  )) {

                if (binarySearchResult.position === -1)
                    binarySearchResult.position = 0;

                //maximum blocks to download
                if ( !this.blockchain.agent.light && forkChainLength >= this.blockchain.blocks.length + consts.SETTINGS.PARAMS.CONNECTIONS.FORKS.MAXIMUM_BLOCKS_TO_DOWNLOAD){
                    fork.downloadAllBlocks = true;
                    forkChainLength = Math.min(forkChainLength, this.blockchain.blocks.length + consts.SETTINGS.PARAMS.CONNECTIONS.FORKS.MAXIMUM_BLOCKS_TO_DOWNLOAD);
                }

                if ( (forkChainLength - binarySearchResult.position) >= consts.SETTINGS.PARAMS.CONNECTIONS.FORKS.MAXIMUM_BLOCKS_TO_DOWNLOAD_TO_USE_SLEEP){
                    fork.downloadBlocksSleep = true;
                }

                fork.forkStartingHeight = binarySearchResult.position;
                fork.forkStartingHeightDownloading  = binarySearchResult.position;
                fork.forkChainStartingPoint = forkChainStartingPoint;
                fork.forkChainLength = forkChainLength;
                fork.forkChainWork = forkChainWork;

                if ( fork.forkStartingHeight > fork.forkChainLength-1 )
                    throw {message: "FORK is empty"};

                console.info("immutability ");
                fork.validateForkImmutability();

                console.info("initialize fork");
                await fork.initializeFork(); //download the requirements and make it ready

                if (!fork.forkReady)
                    throw {message:" FORK IS NOT READY "};

            } else {
                //it is a totally new blockchain (maybe genesis was mined)
                console.log("fork is something new");
                throw {message: "fork is something new", binarySearchResult:binarySearchResult, forkChainStartingPoint:forkChainStartingPoint, forkChainLength:forkChainLength} ;
            }



            return {result: true, fork:fork };

        } catch ( exception ){

            this.blockchain.forksAdministrator.deleteFork(fork);

            console.error("discoverAndProcessFork", exception );

            let bIncludeBan = true;

            if (this.blockchain.agent.light)
                if ([ "FORK is empty", "fork is something new",
                        "discoverAndProcessFork - fork already found by socket",
                        "same proof, but your blockchain is smaller than mine", "Your proof is worse than mine because you have the same block", "fork proof was already downloaded" ].indexOf( exception.message ) >= 0)
                    bIncludeBan = false;

            if (bIncludeBan) {
                console.warn("BANNNNNNNNNNNNNNNNN", socket.node.sckAddress.toString(), exception.message);
                BansList.addBan(socket, 60000, exception.message);
            }

            await this.blockchain.sleep(10);

            return { result:false, error: exception };

        }

    }

    async optionalProcess(socket, binarySearchResult, currentBlockchainLength, forkChainLength, forkChainStartingPoint){

    }

    /**
     * Solve Fork by Downloading  the blocks required in the fork
     * @param fork
     * @returns {Promise.<boolean>}
     */
    async _solveFork(fork) {

        StatusEvents.emit( "agent/status", {message: "Collecting Blockchain", blockHeight: fork.forkStartingHeight } );

        if ( !fork || typeof fork !== "object" )
            throw {message: 'fork is null'};

        let nextBlockHeight = fork.forkStartingHeightDownloading;

        //maybe it was deleted before
        if (fork.sockets.length === 0 || !fork.forkReady)
            return false;

        console.log(" < fork.forkChainLength", fork.forkChainLength, "fork.forkBlocks.length", fork.forkBlocks.length);

        let totalIterations = 0;

        while (( fork.forkStartingHeight + fork.forkBlocks.length < fork.forkChainLength) && !global.TERMINATED  ) {

            totalIterations++;

            if(totalIterations >= 1000){
                console.error("MAX iterations on downloading block")
                break;
            }

            //let socketListOptimized = fork.sockets.sort((a,b) => {return (a.latency > b.latency) ? 1 : ((b.latency > a.latency ) ? -1 : 0);} );

            StatusEvents.emit( "agent/status", {message: "Synchronizing - Downloading Block", blockHeight: nextBlockHeight, blockHeightMax: fork.forkChainLength } );

            let onlyHeader;

            if (this.protocol.acceptBlocks)
                onlyHeader = false;
            else
                if (this.protocol.acceptBlockHeaders)
                    onlyHeader = true;

            let answer;

            let howManyBlocks = Math.min( fork.forkChainLength - (fork.forkStartingHeight + fork.forkBlocks.length), consts.SETTINGS.PARAMS.CONCURRENCY_BLOCK_DOWNLOAD_MINERS_NUMBER);
            let downloadingList = [];
            let trialsList = {};
            let alreadyDownloaded = 0;
            let resolved = false;

            let socketIndex = 0;
            let finished = new Promise((resolve)=>{

                let downloadingBlock = async (index)=>{

                    this.curentIterationsDownloaded++;

                    if ( trialsList[index] > 5 || global.TERMINATED) {

                        if (!resolved) {
                            resolved = true;
                            resolve(false);
                        }

                        return;
                    }

                    socketIndex++;
                    if ( trialsList[index] === undefined ) trialsList[index] = 0;
                    trialsList[index] ++ ;

                    let socket = fork.getForkSocket(socketIndex);

                    if ( !socket ) {

                        await this.blockchain.sleep(5);

                        if (!resolved)
                            downloadingBlock(index);

                        return;
                    }

                    let waitingTime = socket.latency === 0 ? consts.SETTINGS.PARAMS.MAX_ALLOWED_LATENCY : ( socket.latency + Math.random()*2000 );

                    answer = socket.node.sendRequestWaitOnce("blockchain/blocks/request-block-by-height", {height: nextBlockHeight+index}, nextBlockHeight+index,  Math.min( waitingTime, consts.SETTINGS.PARAMS.MAX_ALLOWED_LATENCY)  );
                    downloadingList[index] = answer;

                    answer.then( (result)=>{

                        if ( !result ) {

                            downloadingList[index] = undefined;
                            socket.latency += Math.random()*1500;

                            if (!resolved)
                                downloadingBlock(index);

                        }
                        else {

                            alreadyDownloaded++;
                            downloadingList[index] = result;

                            if ( ((alreadyDownloaded === howManyBlocks) || global.TERMINATED) && !resolved) {
                                resolved = true;
                                resolve(true);
                            }

                        }

                    }).catch( (exception)=>{

                        if (!resolved)
                            downloadingBlock(index);

                    });
                };

                console.info("Downloading Blocks...", howManyBlocks);

                for (let i=0; i < howManyBlocks; i++)
                    trialsList[i] = 0;

                for (let i=0; i < howManyBlocks; i++)
                    if ( !downloadingList[i] )
                        downloadingBlock(i);


            });

            if(this.curentIterationsDownloaded >= 1000){

                console.error("MAX iterations on downloading block")
                this.curentIterationsDownloaded = 0;

            }

            try {
                await finished;
            } catch (exception){
                console.error("Downloading blocks raised an error", exception);
                resolved = true;
                finished = false;
            }

            //verify if all blocks were downloaded

            let blockValidation;
            let block;

            for(let i=0; i<downloadingList.length; i++){

                if ( !downloadingList[i])
                    throw {message: "block never received "+ nextBlockHeight};

                if ( !downloadingList[i].result || !downloadingList[i].block || !Buffer.isBuffer(downloadingList[i].block) ) {
                    console.error("Fork Answer received ", downloadingList[i]);
                    throw {message: "Fork Answer is not Buffer"};
                }

                blockValidation = fork._createBlockValidation_ForkValidation(nextBlockHeight, fork.forkBlocks.length-1);
                block = this._deserializeForkBlock(fork, downloadingList[i].block, nextBlockHeight, blockValidation );

                if (fork.downloadBlocksSleep && nextBlockHeight % 10 === 0)
                    await this.blockchain.sleep(15);

                if (this.blockchain.blocks[block.height] !== undefined && block.calculateNewChainHash().equals(this.blockchain.blocks[block.height].calculateNewChainHash() ) )
                    throw {message: "You gave me a block which I already have have the same block"};

                let result;

                try {

                    result = await fork.includeForkBlock(block);

                } catch (Exception) {

                    console.error("Error including block " + nextBlockHeight + " in fork ", Exception);
                    throw {message: "fork.includeForkBlock returned an exception", Exception}

                }

                fork.forkHeaders.push(block.hash);

                //if the block was included correctly
                if (result){

                    if (nextBlockHeight % 10 === 0)
                        console.log("Block " + nextBlockHeight + " successfully downloaded!");

                    nextBlockHeight++;
                }
                else
                    throw {message: "Fork didn't work at height ", nextBlockHeight};

                if (fork.downloadBlocksSleep && nextBlockHeight % 10 === 0) await this.blockchain.sleep(15);

            }

        }

        if (fork.forkStartingHeight + fork.forkBlocks.length >= fork.forkChainLength ) {

            if (await fork.saveFork())
                return true;
            else
                throw {message: "Save Fork couldn't be saved"};

        }


    }

    _deserializeForkBlock( fork, blockData, blockHeight, validationBlock){

        let block = undefined;

        try {

            block = this.blockchain.blockCreator.createEmptyBlock(blockHeight, validationBlock);

            if (!this.protocol.acceptBlocks && this.protocol.acceptBlockHeaders)
                block.data._onlyHeader = true; //avoiding to store the transactions

            block.deserializeBlock( blockData, blockHeight, undefined );

        } catch (Exception) {
            console.error("Error deserializing blocks ", Exception, blockData);
            return false;
        }

        return block;
    }

}


export default InterfaceBlockchainProtocolForkSolver;
