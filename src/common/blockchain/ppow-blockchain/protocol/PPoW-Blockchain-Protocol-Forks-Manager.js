import InterfaceBlockchainProtocolForksManager from "common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol-Forks-Manager"

class PPoWBlockchainProtocolForksManager extends InterfaceBlockchainProtocolForksManager {

    //will select the best
    _getBestFork(){

        let bestFork = null;

        for (let i=0; i<this.blockchain.forksAdministrator.forks.length; i++ )
            if ( bestFork === null || bestFork.forkChainLength < this.blockchain.forksAdministrator.forks[i].forkChainLength ){
                bestFork = this.blockchain.forksAdministrator.forks[i];
            }

        return bestFork;

    }

}

export default PPoWBlockchainProtocolForksManager();