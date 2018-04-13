import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import PPoWBlockchainProofPi from './../prover/proofs/PPoW-Blockchain-Proof-Pi'
import BlockchainGenesis from 'common/blockchain/global/Blockchain-Genesis'
import consts from 'consts/const_global'

class PPoWBlockchainFork extends InterfaceBlockchainFork {

    async initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header){

        InterfaceBlockchainFork.prototype.initializeConstructor.call(this, blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header);

        this.proofPi = null;
        if (this.blockchain.agent.light) {

            //Downloading Proof Pi
            let socket = sockets;
            if (Array.isArray(sockets))
                socket = sockets[0];

            let answer = await socket.node.sendRequestWaitOnce("get/nipopow-blockchain/headers/get-proofs/pi", {}, "answer");
            if (answer === null || answer === undefined) throw {message: "Proof is invalid"};

            //importing Proof
            this.proofPi = new PPoWBlockchainProofPi(this.blockchain, []);

            await this.importForkProofHeaders( answer );

            //this.proofPi.validateProof();
            this.proofPi.validateProofLastElements(consts.POPOW_PARAMS.m);

        }

    }

    async importForkProofHeaders(blocksHeader){

        for (let i=0; i<blocksHeader.length; i++){

            let block = this.blockchain.blockCreator.createEmptyBlock( blocksHeader[i].height );
            block.blockValidation.getBlockCallBack = this.getForkProofsPiBlock.bind(this);

            await block.importBlockFromHeader( blocksHeader[i] );

            this.proofPi.blocks.push(block);

        }

    }


    getForkProofsPiBlock(height){

        let forkHeight = height - this.forkStartingHeight;

        if (height <= 0)  return BlockchainGenesis; // based on genesis block
        else return this.proofPi.hasBlock(height - 1);
    }


}

export default PPoWBlockchainFork;