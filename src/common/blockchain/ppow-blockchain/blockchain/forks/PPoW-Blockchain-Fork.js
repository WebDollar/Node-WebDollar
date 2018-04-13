import InterfaceBlockchainFork from 'common/blockchain/interface-blockchain/blockchain/forks/Interface-Blockchain-Fork'
import PPoWBlockchainProofPi from './../prover/proofs/PPoW-Blockchain-Proof-Pi'

class PPoWBlockchainFork extends InterfaceBlockchainFork {

    async initializeConstructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header){

        InterfaceBlockchainFork.prototype.initializeConstructor.call(this, blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header);

        if (this.blockchain.agent.light) {

            this.proofPi = null;

            //Downloading Proof Pi
            let socket = sockets;
            if (Array.isArray(sockets))
                socket = sockets[0];

            let answer = await socket.node.sendRequestWaitOnce("get/nipopow-blockchain/headers/get-proofs/pi", {}, "answer");
            if (answer === null || answer === undefined) throw {message: "Proof is invalid"};

            //importing Proof
            this.proofPi = new PPoWBlockchainProofPi([]);
            this.proofPi.importProofHeaders( answer );

            this.proofPi.validateProof();

        }

    }

}

export default PPoWBlockchainFork;