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

        this.socketsProcessing = [];

        NodesList.emitter.on("nodes-list/disconnected", async (nodesListObject) => {

            for (let i=0; i<this.forks.length; i++)
                if (!this.forks[i].forkIsSaving) {

                    for (let j = this.forks[i].sockets.length-1; j >=0 ; j--)
                        if (this.forks[i].sockets[j].node.sckAddress === undefined || this.forks[i].sockets[j].node.sckAddress.uuid === nodesListObject.socket.node.sckAddress.uuid ) {
                            this.forks[i].sockets.splice(j, 1);
                            break;
                        }

                    if (this.forks[i].sockets.length === 0 && !this.forks[i].forkIsSaving ) {

                        this.forks[i].destroyFork();
                        this.forks.splice(i, 1);

                    }
                }

        });

    }


    findFork(socket, hash, forkProof){

        let forkFound = this._findForkyByHeader(hash);
        if ( forkFound !== null ) {

            if (Math.random() < 0.001)
                console.error("discoverAndProcessFork - fork already found by forkLastBlockHeader");

            forkFound.pushSocket( socket, forkProof );
            return {result: true, fork: forkFound};

        }

        forkFound = this.findForkBySockets(socket);
        if ( forkFound !== null ) {

            if (Math.random() < 0.001)
                console.error("discoverAndProcessFork - fork already found by socket");

            return {result: true, fork: forkFound};
        }



        return null;

    }

    createNewFork(sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, forkChainWork, headers, ready){

        if (!Array.isArray(sockets)) sockets = [sockets];

        let fork = this.findForkBySockets(sockets);
        if ( fork !== null ) return fork;

        fork = this.findForkByHeaders(headers);
        if ( fork !== null) return fork;

        fork = this.blockchain.agent.newFork( this.blockchain, this.forksId++, sockets, forkStartingHeight, forkChainStartingPoint, forkChainLength, forkChainWork, headers, ready );

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
    findForkByHeaders(headers){

        if (headers === null || headers === undefined)
            return null;

        if (Array.isArray(headers))
            for (let i=0; i<headers.length; i++) {

                let fork = this._findForkyByHeader(headers[i]);
                if (fork !== null)
                    return fork;
            }
        else
            return this._findForkyByHeader(headers);

        return null;

    }

    _findForkyByHeader(header){

        if ( !header )
            return null;

        for (let i = 0; i < this.forks.length; i++)
            if (this.forks[i] !== null)
            for (let j=0; j<this.forks[i].forkHeaders.length; j++)
                if (this.forks[i].forkHeaders[j] && Buffer.isBuffer(this.forks[i].forkHeaders[j])) {

                    if (this.forks[i].forkHeaders[j].equals(header))
                        return this.forks[i];
                }

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

        if (fork === undefined || fork === null)
            return false;

        for (let i=this.forks.length-1; i>=0; i--)
            if (this.forks[i] === undefined || this.forks[i] === null || this.forks[i] === fork || this.forks[i].forkId === fork) {

                if (this.forks[i] !== undefined && this.forks[i] !== null)
                    this.forks[i].destroyFork();

                this.forks.splice(i, 1);
            }

        return false;
    }

}

export default InterfaceBlockchainForksAdministrator;