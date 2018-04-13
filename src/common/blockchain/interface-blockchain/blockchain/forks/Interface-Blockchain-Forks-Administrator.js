import InterfaceBlockchainFork from './Interface-Blockchain-Fork'
import BufferExtended from "common/utils/BufferExtended"

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */

class InterfaceBlockchainForksAdministrator {


    constructor (blockchain){

        this.blockchain = blockchain;

        this.forks = [];

        this.forksId = 0;

        this.socketsProcessing = [];
    }

    createNewFork(sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, header){

        if (!Array.isArray(sockets)) sockets = [sockets];

        let fork = this.findForkBySockets(sockets);
        if ( fork !== null ) return fork;

        fork = this.findForkByHeader(header);
        if ( fork !== null) return fork;

        fork = this.blockchain.agent.newFork( this.blockchain, this.forksId++, sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, header );

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

        for (let i = 0; i < sockets.length; i++){

            for (let j = 0; j < this.forks.length; j++) {

                for (let q = 0; q < this.forks[j].sockets.length; q++)

                    if ( this.forks[j].sockets[q].node.sckAddress === sockets[i].node.sckAddress ||
                         this.forks[j].sockets[q].node.sckAddress.matchAddress(sockets[i].node.sckAddress) )

                        return this.forks[j];
            }
        }

        return null;
    }

    /**
     * Find a fork by a Header (block header)
     * @param header
     * @returns {*}
     */
    findForkByHeader(header){

        if (header === null || header === undefined)
            return null;

        if (header.hash === null || header.hash === undefined)
            return null;

        for (let i = 0; i < this.forks.length; i++)
            if ( this.forks[i].forkHeader !== null && this.forks[i].forkHeader.hash !== undefined && this.forks[i].forkHeader.hash !== null &&
                (this.forks[i].forkHeader === header || BufferExtended.safeCompare(this.forks[i].forkHeader.hash, header.hash )) )
                return this.forks[i];

        return null;
    }

    findForkByProofs(proof){

        if (proof === null || proof === undefined) return false;

        try{

            for (let i=0; i<this.forks.length; i++)
                if (this.forks[i].forkProofPi.equalsProofs(proof))
                    return this.forks[i];

        } catch (exception) {

        }

        return null;
    }

    deleteFork(fork){

        if (fork === undefined)
            return false;

        for (let i=0; i<this.forks.length; i++)
            if (this.forks[i] === fork || this.forks[i].forkId === fork) {
                this.forks.splice(i,1);
                return true;
            }

        return false;
    }

}

export default InterfaceBlockchainForksAdministrator;