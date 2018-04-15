import InterfaceBlockchainProtocolForksManager from "common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol-Forks-Manager"

class PPoWBlockchainProtocolForksManager extends InterfaceBlockchainProtocolForksManager {

    //will select the best
    async _getBestFork(){

        if (!this.blockchain.agent.light)
            return InterfaceBlockchainProtocolForksManager.prototype._getBestFork.call(this);

        let bestFork = null;
        let fork = null;

        try {

            for (let i = 0; i < this.blockchain.forksAdministrator.forks.length; i++) {

                fork = this.blockchain.forksAdministrator.forks[i];
                if (!fork.ready) continue;

                if (fork.forkChainStartingPoint < fork.forkStartingHeight && (bestFork === null || bestFork.forkChainLength < fork.forkChainLength) ) //it is a small fork that I already have the first forks, but I will download the remaning blocks
                {

                    bestFork = fork;

                } else if ( bestFork !==  null && bestFork.forkProofPi !== null && fork.forkProofPi !== null ) {

                    let compare = await this.blockchain.verifier.compareProofs(bestFork.forkProofPi, fork.forkProofPi);

                    if (compare < 0 //better proof
                        || (compare === 0 && bestFork.forkChainLength < fork.forkChainLength)) {

                        bestFork = fork;

                    }

                } else if ( (bestFork ===  null || bestFork.forkProofPi === null) && fork.forkProofPi !== null){

                    bestFork = fork;

                }

            }

        } catch (exception){
            console.error("_getBestFork returned an exception", exception );
            throw {message: exception, fork: fork}
        }

        return bestFork;
    }

}

export default PPoWBlockchainProtocolForksManager;