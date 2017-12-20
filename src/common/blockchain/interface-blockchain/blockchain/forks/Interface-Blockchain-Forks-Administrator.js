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

    createNewFork(sockets, forkStartingHeight, forkChainLength, header){

        let fork;

        fork = this.findForkBySockets(sockets);
        if (fork !== null) return fork;

        fork = this.findForkByHeader(header);
        if (fork !== null) return fork;


        fork = new InterfaceBlockchainFork( this.blockchain, this.forksId++, sockets, forkStartingHeight, forkChainLength, header);

        this.forks.push(fork);

        return fork;
    }

    /**
     * Find a fork by a socket
     * @param sockets
     * @returns {*}
     */

    findForkBySockets(sockets){

        if (!Array.isArray(sockets)) sockets = [sockets];

        for (let i=0; i<sockets.length; i++){

            for (let j=0; j<this.forks.length; j++)
                if (this.forks[j].sockets.indexOf(sockets[i]))
                    return this.forks[j];
        }

        return null;
    }

    /**
     * Find a fork by a Header (block header)
     * @param header
     * @returns {*}
     */
    findForkByHeader(header){

        for (let i=0; i<this.forks.length; i++)
            if (this.forks[i].forkHeader === header || this.forks[i].forkHeader.hash.equals( header.hash ) )
                return this.forks[i];

        return null;
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