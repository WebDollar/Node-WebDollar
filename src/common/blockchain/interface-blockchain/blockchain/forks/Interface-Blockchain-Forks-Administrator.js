import InterfaceBlockchainFork from './Interface-Blockchain-Fork'
import BufferExtended from "common/utils/BufferExtended"
import NodesList from 'node/lists/Nodes-List';

/**
 * Blockchain contains a chain of blocks based on Proof of Work
 */

class InterfaceBlockchainForksAdministrator {


    constructor (blockchain){

        this.blockchain = blockchain;

        this.forks = [];
        this.forksId = 0;

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {

            for (let i=this.forks.length-1; i>=0; i--)
                if (!this.forks[i].forkIsSaving) {

                    for (let j = this.forks[i].sockets.length-1; j >=0 ; j--)
                        if ( !this.forks[i].sockets[j].node.sckAddress || this.forks[i].sockets[j].node.sckAddress.uuid === nodesListObject.socket.node.sckAddress.uuid ) {
                            this.forks[i].sockets.splice(j, 1);
                            break;
                        }

                    if (this.forks[i].sockets.length === 0 && !this.forks[i].forkIsSaving )
                        this.forks.splice(i, 1);
                }

        });

    }


    findFork(socket, hash, forkProof){

        let forkFound = this.findForkyByChainHash(hash);
        if ( forkFound ) {

            if (Math.random() < 0.001)
                console.error("discoverAndProcessFork - fork already found by forkLastBlockHeader");

            forkFound.pushSocket( socket, forkProof );
            return {result: true, fork: forkFound};

        }

        forkFound = this.findForkBySockets(socket);
        if ( forkFound ) {

            if (Math.random() < 0.001)
                console.error("discoverAndProcessFork - fork already found by socket");

            return {result: true, fork: forkFound};
        }


        return null;

    }

    createNewFork(sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, forkChainWork, forkChainHashes, ready){

        if (!Array.isArray(sockets)) sockets = [sockets];

        let fork = this.findForkBySockets(sockets);
        if ( fork ) return fork;

        for (let key in forkChainHashes)
            if (this.findForkyByChainHash(key))
                return fork;

        fork = this.blockchain.agent.newFork( this.blockchain, this.forksId++, sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, forkChainWork, forkChainHashes, ready );

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
                         this.forks[j].sockets[q].node.sckAddress.uuid === sockets[i].node.sckAddress.uuid )

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

    findForkyByChainHash(header){

        if ( !header )
            return null;

        if (Buffer.isBuffer(header))
            header = header.toString("hex");

        for (let fork of this.forks)
            if (fork.forkChainHashes[header]) return fork;

        return null;

    }

    findForkByProofs(proof){

        if ( !proof ) return false;

        try{

            for (let i=0; i<this.forks.length; i++)
                if (this.forks[i].forkProofPi.equalsProofs(proof))
                    return this.forks[i];

        } catch (exception) {

        }

        return null;
    }

    deleteFork(fork){

        if (!fork ) return false;

        for (let i=this.forks.length-1; i>=0; i--)
            if ( !this.forks[i] || this.forks[i] === fork || this.forks[i].forkId === fork)
                this.forks.splice(i, 1);

        return false;
    }

}

export default InterfaceBlockchainForksAdministrator;