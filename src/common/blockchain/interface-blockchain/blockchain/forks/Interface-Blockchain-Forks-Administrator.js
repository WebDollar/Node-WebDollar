import NodeProtocol from 'common/sockets/protocol/node-protocol';

import InterfaceBlockchainFork from './Interface-Blockchain-Fork'
/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainFork {


    constructor (blockchain){

        this.blockchain = blockchain;
        this.forks = [];

        this.forksId = 0;

    }

    createNewFork(sockets, forkStartingHeight){

        let fork = new InterfaceBlockchainFork( this.blockchain, this.forksId++, sockets, forkStartingHeight);

        this.forks.push(fork);

        return fork;

    }

}

export default InterfaceBlockchainFork;