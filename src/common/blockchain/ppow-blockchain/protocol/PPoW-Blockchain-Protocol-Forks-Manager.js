import InterfaceBlockchainProtocolForksManager from "common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol-Forks-Manager"

class PPoWBlockchainProtocolForksManager extends InterfaceBlockchainProtocolForksManager {

    //will select the best
    _getBestFork(){

        if (!this.blockchain.agent.light)
            return InterfaceBlockchainProtocolForksManager.prototype._getBestFork.call(this);

        let bestFork = null;

        this.blockchain.forksAdministrator.forks.forEach((fork)=>{



            if ( bestFork === null
                || (fork.forkChainStartingPoint < fork.forkStartingHeight && bestFork.forkChainLength < fork.forkChainLength )) //it is a small fork that I already have the first forks, but I will download the remaning blocks
            {

                bestFork = fork;

            } else
            if (bestFork.proofPi !== null && fork.proofPi !== null){

                let compare = this.blockchain.verifier.compareProofs(bestFork.proofPi, bestFork.proofPi);

                if (compare < 0 //better proof
                    || (compare === 0 && bestFork.forkChainLength < fork.forkChainLength) ){

                    bestFork = fork;

                }

            }

        });


        return bestFork;
    }

}

export default PPoWBlockchainProtocolForksManager();