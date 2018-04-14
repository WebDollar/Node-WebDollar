import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import PPoWBlockchainProofPi from './../prover/proofs/PPoW-Blockchain-Proof-Pi'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'

class PPoWBlockchainFork extends InterfaceBlockchainFork {

    async initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header){

        InterfaceBlockchainFork.prototype.initializeConstructor.call(this, blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header);

        this.forkProofPi = null;
        this._forkProofPiClone = null;

        if (this.blockchain.agent.light && (forkChainStartingPoint === forkStartingHeight)) {

            //Downloading Proof Pi

            let answer = await this.getSocket().node.sendRequestWaitOnce("get/nipopow-blockchain/headers/get-proofs/pi", {}, "answer", consts.SETTINGS.PARAMS.CONNECTIONS.TIMEOUT.WAIT_ASYNC_DISCOVERY_TIMEOUT);
            if (answer === null || answer === undefined) throw {message: "Proof is invalid"};

            //importing Proof
            this.forkProofPi = new PPoWBlockchainProofPi(this.blockchain, []);

            await this.importForkProofHeaders( answer );

            //this.forkProofPi.validateProof();
            this.forkProofPi.validateProofLastElements(consts.POPOW_PARAMS.m);

        }

    }

    async importForkProofHeaders(blocksHeader){

        for (let i=0; i<blocksHeader.length; i++){

            let block = this.blockchain.blockCreator.createEmptyBlock( blocksHeader[i].height );
            block.blockValidation.getBlockCallBack = this.getForkProofsPiBlock.bind(this);

            await block.importBlockFromHeader( blocksHeader[i] );

            this.forkProofPi.blocks.push(block);

        }

    }


    getForkProofsPiBlock(height){
        if (height <= 0)  return BlockchainGenesis; // based on genesis block
        else return this.forkProofPi.hasBlock(height - 1);
    }


    preForkClone(cloneBlocks=true){

        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {
            this._forkProofPiClone = this.blockchain.proofPi;
        }

        InterfaceBlockchainFork.prototype.preForkClone.call(this, cloneBlocks);

    }

    preFork(revertActions){

        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {
            this.blockchain.proofPi = this.forkProofPi;
        }

        InterfaceBlockchainFork.prototype.preFork.call(this, revertActions);
    }

    revertFork(){

        if (this.blockchain.agent.light && (this.forkChainStartingPoint === this.forkStartingHeight) ) {
            this.blockchain.proofPi = this._forkProofPiClone;
        }

        InterfaceBlockchainFork.prototype.revertFork.call(this);

    }

}

export default PPoWBlockchainFork;