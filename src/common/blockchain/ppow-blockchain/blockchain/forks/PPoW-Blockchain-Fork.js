import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import PPoWBlockchainProofPi from './../prover/proofs/PPoW-Blockchain-Proof-Pi'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended"
import StatusEvents from "common/events/Status-Events";
import PPoWHelper from '../helpers/PPoW-Helper'

class PPoWBlockchainFork extends InterfaceBlockchainFork {

    async initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, headers, forkReady){

        InterfaceBlockchainFork.prototype.initializeConstructor.call(this, blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, headers, forkReady);

        this.forkProofPi = null;
        this._forkProofPiClone = null;

    }

    async initializeFork(){

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

            let proofPiData = await this.getSocket().node.sendRequestWaitOnce("get/nipopow-blockchain/headers/get-proofs/pi/hash", {}, "answer", 3000 );

            if (proofPiData === null || proofPiData === undefined) throw { message: "Proof Failed to answer" };

            if (typeof proofPiData.length !== "number" || proofPiData.length <= 0) throw {message: "Proof Pi length is invalid"};

            if (this.blockchain.proofPi !== null && this.blockchain.proofPi.hash.equals(proofPiData.hash)) {

                if (this.forkChainStartingPoint === this.forkStartingHeight) // it is a new fork
                    throw {message: "Proof Pi is the same with mine"}
                else
                    return true; //i already have this forkProof

            }

            if (this.blockchain.forksAdministrator.findForkByProofs(proofPiData.hash) !== null)
                throw {message: "fork proof was already downloaded"};

            //importing Proof
            this.forkProofPi = new PPoWBlockchainProofPi(this.blockchain, []);
            this.forkProofPi.hash = proofPiData.hash;

            let i = 0, length = 100;
            let proofsList = [];

            while ( i*length < proofPiData.length ){

                StatusEvents.emit( "agent/status", {message: "Proofs - Downloading", blockHeight: Math.min( (i+1) *length, proofPiData.length )  } );

                let answer = await this.getSocket().node.sendRequestWaitOnce( "get/nipopow-blockchain/headers/get-proofs/pi", {starting: i * length, length: length}, "answer", consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT );
                if (answer === null || answer === undefined) throw { message: "Proof is empty" };

                for (let i=0; i<answer.length; i++)
                    proofsList.push(answer[i]);

                i++;
            }

            StatusEvents.emit( "agent/status", {message: "Proofs - Preparing", blockHeight: this.forkStartingHeight } );

            if (this.blockchain.proofPi !== null) {

                this.forkProofPi.blocks = proofsList;

                let LCA = PPoWHelper.LCA(this.blockchain.proofPi, this.forkProofPi);

                let comparison = this.blockchain.verifier.compareProofs( this.blockchain.proofPi, this.forkProofPi, LCA );

                //in case my proof is better than yours
                if (comparison > 0) throw {message: "Proof is worst than mine"};

                //in case my proof is equals with yours and it is not a new proof

                this.forkProofPi.blocks = [];

                for (let i=0; i<this.blockchain.proofPi.blocks.length; i++)
                    if (this.blockchain.proofPi.blocks[i].height <= LCA.height )
                        this.forkProofPi.blocks.push( this.blockchain.proofPi.blocks[i] );

                if (this.forkProofPi.blocks.length === 0) throw {message: "Proof is invalid LCA nothing"};

                await this.importForkProofPiHeaders( proofsList, LCA.height );

            } else {
                await this.importForkProofPiHeaders( proofsList );
            }


            //this.forkProofPi.validateProof();
            if (! this.forkProofPi.validateProofLastElements(consts.POPOW_PARAMS.m))
                throw {message: "Prof Pi is invalid"};

            StatusEvents.emit( "agent/status", {message: "Proofs Validated", blockHeight: this.forkStartingHeight } );

            return true;

        }

    }

    _validateFork(validateHashesAgain){

        //this._validateProofXi();

        if ( this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {

            if (this.blockchain.proofPi !== null && this.blockchain.proofPi.hash.equals(this.forkProofPi.hash))
                throw {message: "Proof Pi is the same with mine"};

            if (this.blockchain.proofPi !== null && this.blockchain.verifier.compareProofs(this.blockchain.proofPi, this.forkProofPi) >= 0)
                throw {message: "Proof is worst than mine"};

            return true;

        }


        return InterfaceBlockchainFork.prototype._validateFork.call(this, validateHashesAgain );

    }

    async importForkProofPiHeaders(blocksHeader, LCAHeight = -1 ){

        for (let i=0; i<blocksHeader.length; i++){

            if (blocksHeader[i].height <= LCAHeight) continue;

            let block = this.blockchain.blockCreator.createEmptyBlock( blocksHeader[i].height );
            block.blockValidation.getBlockCallBack = this.getForkProofsPiBlock.bind(this);

            await block.importBlockFromHeader( blocksHeader[i] );

            this.forkProofPi.blocks.push(block);

            StatusEvents.emit( "agent/status", { message: "Validating Proof ", blockHeight: i } );
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

        if (this.blockchain.agent.light )
            this._forkProofPiClone = this.blockchain.proofPi;

        return InterfaceBlockchainFork.prototype.preForkClone.call(this, cloneBlocks);

    }

    preFork(revertActions){

        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {
            this.blockchain.proofPi = this.forkProofPi;
        }

        return InterfaceBlockchainFork.prototype.preFork.call(this, revertActions);
    }

    revertFork(){

        if (this.blockchain.agent.light )
            this.blockchain.proofPi = this._forkProofPiClone;

        return InterfaceBlockchainFork.prototype.revertFork.call(this);

    }

}

export default PPoWBlockchainFork;