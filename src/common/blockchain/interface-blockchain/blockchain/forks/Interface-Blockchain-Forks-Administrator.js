import NodeProtocol from 'common/sockets/protocol/node-protocol';

import InterfaceBlockchainFork from './Interface-Blockchain-Fork'
/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */
class InterfaceBlockchainForksAdministrator {


    constructor (blockchain){

        this.blockchain = blockchain;
        this.forks = [];

        this.forksId = 0;

    }

    createNewFork(sockets, forkStartingHeight, forkHeight){

        let fork = new InterfaceBlockchainFork( this.blockchain, this.forksId++, sockets, forkStartingHeight, forkHeight);

        this.forks.push(fork);

        return fork;
    }

    deleteFork(fork){

        for (let i=0; i<this.forks.length; i++)
            if (this.forks[i] === fork || this.forks[i].forkId === fork) {
                this.forks.splice(i,1);
                return true;
            }
        return false;
    }

}

export default InterfaceBlockchainForksAdministrator;