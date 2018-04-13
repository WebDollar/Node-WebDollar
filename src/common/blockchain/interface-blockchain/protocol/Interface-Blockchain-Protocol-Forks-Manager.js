class InterfaceBlockchainProtocolForksManager{

    constructor(blockchain, protocol){

        this.blockchain = blockchain;
        this.protocol = protocol;

        this.processForksQueue();
    }

    /*
        may the fork2 be with you Otto
    */
    async newForkTip(socket, newChainLength, newChainStartingPoint, forkLastBlockHeader){

        if (typeof newChainLength !== "number") throw {message: "newChainLength is not a number"};
        if (typeof newChainStartingPoint !== "number") throw {message: "newChainStartingPoint is not a number"};

        if (newChainLength < this.blockchain.blocks.length){

            socket.node.sendRequest( "blockchain/header/new-block", this.blockchain.blocks.last.getBlockHeaderWithInformation() );

            throw {message: "Your blockchain is smaller than mine"};

        }

        if (newChainStartingPoint > newChainLength) throw {message: "Incorrect newChainStartingPoint"};
        if (newChainStartingPoint < 0 ) throw {message: "Incorrect2 newChainStartingPoint"};
        if (newChainStartingPoint > forkLastBlockHeader.height ) throw {message: "Incorrect3 newChainStartingPoint"};


        let fork = await this.protocol.forkSolver.discoverFork(socket, newChainLength, newChainStartingPoint, forkLastBlockHeader);
        if (fork.result)
            return fork.forkPromise;
        else
            return false;

    }

    async processForksQueue(){

        let bestFork = await this._getBestFork();

        if (bestFork !== null) {

            let answer = {};
            try {

                answer = await this.protocol.forkSolver.processFork(bestFork);

                if (answer)
                    this.blockchain.forksAdministrator.deleteFork(bestFork);

            } catch (exception) {

                console.error("processForksQueue returned an error", exception);
                console.warn("BANNNNNNNNNNNNNNNNN", answer.message);

            }

        }

        setTimeout( this.processForksQueue.bind(this), 200 );
    }


    //will select the best
    //will select the best
    _getBestFork(){

        let bestFork = null;

        this.blockchain.forksAdministrator.forks.forEach((fork)=>{

            if ( bestFork === null || bestFork.forkChainLength < fork.forkChainLength )
                bestFork = fork;

        });


        return bestFork;
    }

}

export default InterfaceBlockchainProtocolForksManager;