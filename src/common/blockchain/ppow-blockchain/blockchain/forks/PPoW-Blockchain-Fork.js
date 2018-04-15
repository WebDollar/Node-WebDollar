import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import PPoWBlockchainProofPi from './../prover/proofs/PPoW-Blockchain-Proof-Pi'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'
import BufferExtended from "common/utils/BufferExtended"
import StatusEvents from "common/events/Status-Events";

class PPoWBlockchainFork extends InterfaceBlockchainFork {

    async initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, headers, ready){

        InterfaceBlockchainFork.prototype.initializeConstructor.call(this, blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, headers, ready);

        this.forkProofPi = null;
        this._forkProofPiClone = null;

    }

    set ready(newValue){
        this._ready = newValue;

        if (newValue)
            if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {
                this._ready = false;
                this._downloadProof();
            }
    }

    get ready(){
        return this._ready;
    }

    async _downloadProof(){

        //Downloading Proof Pi
        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {


            StatusEvents.emit( "agent/status", {message: "Downloading Proofs", blockHeight: this.forkStartingHeight } );

            let answer = await this.getSocket().node.sendRequestWaitOnce("get/nipopow-blockchain/headers/get-proofs/pi", {}, "answer", consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT);
            if (answer === null || answer === undefined) throw {message: "Proof is invalid"};

            //importing Proof
            this.forkProofPi = new PPoWBlockchainProofPi(this.blockchain, []);

            StatusEvents.emit( "agent/status", {message: "Preparing Proof", blockHeight: this.forkStartingHeight } );

            await this.importForkProofHeaders( answer );

            //this.forkProofPi.validateProof();
            this.forkProofPi.validateProofLastElements(consts.POPOW_PARAMS.m);

            StatusEvents.emit( "agent/status", {message: "Proofs Validated", blockHeight: this.forkStartingHeight } );

            this._ready = true;
        }

    }

    _validateFork(validateHashesAgain){

        //this._validateProofXi();

        return InterfaceBlockchainFork.prototype._validateFork.call(this, validateHashesAgain );

    }

    async importForkProofHeaders(blocksHeader){

        for (let i=0; i<blocksHeader.length; i++){

            let block = this.blockchain.blockCreator.createEmptyBlock( blocksHeader[i].height );
            block.blockValidation.getBlockCallBack = this.getForkProofsPiBlock.bind(this);

            await block.importBlockFromHeader( blocksHeader[i] );

            this.forkProofPi.blocks.push(block);

            StatusEvents.emit( "agent/status", {message: "Validating Proof ", blockHeight: i } );
        }

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