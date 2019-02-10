import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import PPoWBlockchainProofPi from './../prover/proofs/PPoW-Blockchain-Proof-Pi'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'
import StatusEvents from "common/events/Status-Events";
import PPoWHelper from '../helpers/PPoW-Helper'
import BansList from "common/utils/bans/BansList";
import GZip from "common/utils/GZip";

class PPoWBlockchainFork extends InterfaceBlockchainFork {

    async initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, forkChainWork, headers, forkReady){

        InterfaceBlockchainFork.prototype.initializeConstructor.call(this, blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, forkChainWork, headers, forkReady);

        this.forkProofPi = undefined;
        this._forkProofPiClone = undefined;

    }

    destroyFork(){

        try {
            if (this.blockchain === undefined) return; //already destroyed

            if (this._forkProofPiClone !== undefined && (this.blockchain.proofPi === undefined || this.blockchain.proofPi !== this._forkProofPiClone))
                this._forkProofPiClone.destroyProof();

            this._forkProofPiClone = undefined;

            if (this.forkProofPi !== undefined && (this.blockchain.proofPi === undefined || this.blockchain.proofPi !== this.forkProofPi))
                this.forkProofPi.destroyProof();

            this.forkProofPi = undefined;
        } catch (exception){
            console.error("PPoW destroyFork raised an exception ", exception)
        }

        InterfaceBlockchainFork.prototype.destroyFork.call(this);

    }

    async initializeFork(){

        if (this.blockchain === undefined) return false;

        if ( this.blockchain.agent.light ) {
            if (! (await this._downloadProof()))
                return false;
        }

        return InterfaceBlockchainFork.prototype.initializeFork.call(this);
    }

    async _downloadProof(){

        //Downloading Proof Pi
        if (this.blockchain.agent.light ) {

            StatusEvents.emit( "agent/status", {message: "Downloading Proofs", blockHeight: this.forkStartingHeight } );

            let socket, proofPiData;

            //TODO parallel downloading

            for (let i=0; i<this.sockets.length; i++){

                socket = this.sockets[i];

                proofPiData = await socket.node.sendRequestWaitOnce("get/nipopow-blockchain/headers/get-proofs/pi/hash", {}, "answer", consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT );

                if (proofPiData === null || proofPiData === undefined)
                    BansList.addBan(socket, 10000, "proofPiFailed");
                else {
                    this.sockets[0] = socket;
                    break;
                }
            }

            if (proofPiData === null || proofPiData === undefined)
                throw { message: "Proof Failed to answer" };

            if (typeof proofPiData.length !== "number" || proofPiData.length <= 0) throw {message: "Proof Pi length is invalid"};

            if (this.blockchain.proofPi !== undefined && this.blockchain.proofPi.hash.equals(proofPiData.hash)) {

                if (this.forkChainWork.greater(this.blockchain.blocks.chainWork)){
                    this.forkProofPi = this.blockchain.proofPi;
                    return true;
                } //you have actually more forks but with the same proof
                else throw {message: "same proof, but your blockchain is smaller than mine"}

            }

            if (this.blockchain.forksAdministrator.findForkByProofs(proofPiData.hash) !== null)
                throw {message: "fork proof was already downloaded"};


            //importing Proof
            this.forkProofPi = new PPoWBlockchainProofPi(this.blockchain, []);
            this.forkProofPi.hash = proofPiData.hash;

            let proofsList = [];

            let downloading = true;
            let pos = 0;
            let buffers = [];
            let timeoutCount = 100;

            while (downloading && pos < timeoutCount) {

                let answer = await socket.node.sendRequestWaitOnce("get/nipopow-blockchain/headers/get-proofs/pi-gzip", {
                        starting: pos * consts.SETTINGS.PARAMS.MAX_SIZE.SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES,
                        length: consts.SETTINGS.PARAMS.MAX_SIZE.SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES
                    }, "answer" , 10000);

                if (answer === null) throw {message: "get-proofGziped never received ", answer: answer };
                if (!answer.result) throw {message: "get-proofGziped return false ", answer: answer.message };

                if ( !Buffer.isBuffer(answer.data) )
                    throw {message: "accountantTree data is not a buffer"};

                if (answer.data.length === consts.SETTINGS.PARAMS.MAX_SIZE.SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES ||
                    (answer.data.length <= consts.SETTINGS.PARAMS.MAX_SIZE.SPLIT_CHUNKS_BUFFER_SOCKETS_SIZE_BYTES && !answer.moreChunks))
                {

                    buffers.push(answer.data);

                    if (!answer.moreChunks)
                        downloading = false;

                }

                pos++;

            }

            let buffer = Buffer.concat(buffers);

            try {

                buffer = await GZip.unzip(buffer);

            } catch (exception){

            }

            let offset = 0;
            while(offset!=buffer.length){

                let result = this.forkProofPi.deserializeProof(buffer, offset);

                proofsList.push(result.data);
                offset = result.offset;

            }


            if (proofsList.length === 0)
                throw {message: "Proofs was not downloaded successfully"};

            if (proofsList.length < 150)
                console.error("PROOFS LIST length is less than 150", proofsList.length);

            StatusEvents.emit( "agent/status", {message: "Proofs - Preparing", blockHeight: this.forkStartingHeight } );

            if (this.blockchain === undefined){
                console.warn("Strange this.blockchain is empty");
                return;
            }

            if ( this.blockchain.proofPi !== undefined) {

                this.forkProofPi.blocks = proofsList;

                let LCA = PPoWHelper.LCA(this.blockchain.proofPi, this.forkProofPi);

                this._isProofBetter(LCA);


            } else {
            }

            this.forkProofPi.blocks = [];

            await this.importForkProofPiHeaders( proofsList );

            //this.forkProofPi.validateProof();
            if (! this.forkProofPi.validateProofLastElements(consts.POPOW_PARAMS.m))
                throw {message: "Prof Pi is invalid"};

            StatusEvents.emit( "agent/status", {message: "Proofs Validated", blockHeight: this.forkStartingHeight } );

            return true;

        }

    }

    _validateFork(validateHashesAgain, firstValidation ){

        //this._validateProofXi();

        if (!this.blockchain.agent.light)
            return InterfaceBlockchainFork.prototype._validateFork.call(this, validateHashesAgain );

        if (this.forkProofPi === undefined) throw {message: "Proof is invalid being null"};

        if ( this.blockchain.proofPi !== undefined ) {

            if (this._isProofBetter())
                return true;

        } else return true;

    }

    async importForkProofPiHeaders( proofsList ){

        for (let i = 0; i < proofsList.length; i++){

            //let's verify if I already have this block
            let found = false, block = undefined;

            if (this.blockchain.proofPi ) {

                let searchBlock = this.blockchain.proofPi.findBlockByHeight(proofsList[i].height);

                //the block is already included in my original proof
                if (searchBlock !== null && searchBlock.hash.equals(proofsList[i].hash)) {
                    block = searchBlock;
                    found = true;
                }
            }

            if (!found) {
                block = this.blockchain.blockCreator.createEmptyBlock(proofsList[i].height);
                await block.importBlockFromHeader( proofsList[i] );
            }

            block.blockValidation.getBlockCallBack = this.getForkProofsPiBlock.bind(this);
            this.forkProofPi.blocks.push(block);

            StatusEvents.emit( "agent/status", { message: "Validating Proof ", blockHeight: i } );

        }

        this.forkProofPi.calculateProofHash();

    }


    getForkProofsPiBlock(height){
        
        if (height <= 0) 
            return BlockchainGenesis; // based on genesis block
        else {

            let block = this.forkProofPi.hasBlock(height - 1);
            if (block !== null)
                return block;

            return this.getForkBlock(height);

        }
    }


    preForkClone(cloneBlocks=true){

        if (this.blockchain.agent.light )
            this._forkProofPiClone = this.blockchain.proofPi;

        return InterfaceBlockchainFork.prototype.preForkClone.call(this, cloneBlocks);

    }

    revertFork(){

        if (this.blockchain.agent.light )
            this.blockchain.proofPi = this._forkProofPiClone;

        return InterfaceBlockchainFork.prototype.revertFork.call(this);

    }

    _isProofBetter(LCA){

        let comparison = this.blockchain.verifier.compareProofs( this.blockchain.proofPi, this.forkProofPi, LCA );

        //in case my proof is equals with yours and it is not a new proof

        if (comparison > 0)
            if (this.forkStartingHeight < this.blockchain.proofPi.lastProofBlock.height) //it didn't make a real fork, but it has new blocks
                throw {message: "Proof is worst than mine"};

        if (comparison === 0 && this.forkProofPi.lastProofBlock.height <= this.blockchain.proofPi.lastProofBlock.height ) {

            if (comparison === 0 && this.forkChainLength < this.blockchain.blocks.length) throw {message: "Your proof is worst than mine"};

            if (comparison === 0 && this.forkChainLength === this.blockchain.blocks.length && this.forkHeaders[0].compare(this.blockchain.getHashPrev(this.forkStartingHeight + 1)) >= 0)
                throw {message: "Your proof is worst than mine because you have the same block"};

        }

        return true;

    }

    _shouldTakeNewProof(){

        if (this.blockchain.proofPi === undefined)
            return true;

        let comparison = this.blockchain.verifier.compareProofs( this.blockchain.proofPi, this.forkProofPi );

        //in case my proof is equals with yours and it is not a new proof

        if (comparison > 0) //it is worst than my proof
            return false;
        else
        if (comparison === 0 && this.forkProofPi.lastProofBlock.height <= this.blockchain.proofPi.lastProofBlock.height ) //you have less than my proof
            return false;

        //your proof is better than mine

        return true;

    }

}

export default PPoWBlockchainFork;