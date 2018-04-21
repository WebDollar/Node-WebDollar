import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import PPoWBlockchainProofPi from './../prover/proofs/PPoW-Blockchain-Proof-Pi'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended"
import StatusEvents from "common/events/Status-Events";

class PPoWBlockchainFork extends InterfaceBlockchainFork {

    async initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, headers, forkReady){

        InterfaceBlockchainFork.prototype.initializeConstructor.call(this, blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, headers, forkReady);

        this.forkProofPi = null;
        this._forkProofPiClone = null;

    }

    async initializeFork(){

        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {
            if (! (await this._downloadProof()))
                return false;
        }

        return InterfaceBlockchainFork.prototype.initializeFork.call(this);
    }

    async _downloadProof(){

        //Downloading Proof Pi
        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {

            StatusEvents.emit( "agent/status", {message: "Downloading Proofs", blockHeight: this.forkStartingHeight } );

            let proofPiData = await this.getSocket().node.sendRequestWaitOnce("get/nipopow-blockchain/headers/get-proofs/pi/hash", {}, "answer", 3000 );

            if (proofPiData === null || proofPiData === undefined) throw { message: "Proof Failed to answer" };

            if (typeof proofPiData.length !== "number" || proofPiData.length <= 0) throw {message: "Proof Pi length is invalid"};

            if (this.blockchain.proofPi !== null && this.blockchain.proofPi.hash.equals(proofPiData.hash))
                throw {message: "Proof Pi is the same with mine"};

            if (this.blockchain.forksAdministrator.findForkByProofs(proofPiData.hash) !== null)
                throw {message: "fork proof was already downloaded"};

            //importing Proof
            this.forkProofPi = new PPoWBlockchainProofPi(this.blockchain, []);

            let i = 0, length = 100;
            let proofsList = [];
            while (i*length < proofPiData.length){

                StatusEvents.emit( "agent/status", {message: "Proofs - Downloading", blockHeight: Math.min( i*length, proofPiData.length )  } );

                let answer = await this.getSocket().node.sendRequestWaitOnce( "get/nipopow-blockchain/headers/get-proofs/pi", {starting: i * length, length: length}, "answer", consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT );
                if (answer === null || answer === undefined) throw { message: "Proof is empty" };

                for (let i=0; i<answer.length; i++)
                    proofsList.push(answer[i]);

                i++;
            }

            StatusEvents.emit( "agent/status", {message: "Proofs - Preparing", blockHeight: this.forkStartingHeight } );

            await this.importForkProofPiHeaders( proofsList );

            //this.forkProofPi.validateProof();
            if (! this.forkProofPi.validateProofLastElements(consts.POPOW_PARAMS.m))
                throw {message: "Prof Pi is invalid"};

            StatusEvents.emit( "agent/status", {message: "Proofs Validated", blockHeight: this.forkStartingHeight } );

            return true;

        }

    }

    _validateFork(validateHashesAgain){

        //this._validateProofXi();

        return InterfaceBlockchainFork.prototype._validateFork.call(this, validateHashesAgain );

    }

    async importForkProofPiHeaders(blocksHeader){

        for (let i=0; i<blocksHeader.length; i++){

            let block = this.blockchain.blockCreator.createEmptyBlock( blocksHeader[i].height );
            block.blockValidation.getBlockCallBack = this.getForkProofsPiBlock.bind(this);

            await block.importBlockFromHeader( blocksHeader[i] );

            this.forkProofPi.blocks.push(block);

            StatusEvents.emit( "agent/status", {message: "Validating Proof ", blockHeight: i } );
        }

        this.forkProofPi.calculateProofHash();

    }


    getForkProofsPiBlock(height){
        if (height <= 0)  return BlockchainGenesis; // based on genesis block
        else {

            let block = this.forkProofPi.hasBlock(height - 1);
            if (block !== null) return block;

            return this.getForkBlock(height);

        }
    }


    preForkClone(cloneBlocks=true){

        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {
            this._forkProofPiClone = this.blockchain.proofPi;
        }

        return InterfaceBlockchainFork.prototype.preForkClone.call(this, cloneBlocks);

    }

    preFork(revertActions){

        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {
            this.blockchain.proofPi = this.forkProofPi;
        }

        return InterfaceBlockchainFork.prototype.preFork.call(this, revertActions);
    }

    revertFork(){

        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {
            this.blockchain.proofPi = this._forkProofPiClone;
        }

        return InterfaceBlockchainFork.prototype.revertFork.call(this);

    }

}

export default PPoWBlockchainFork;