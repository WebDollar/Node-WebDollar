class InterfaceBlockchainProtocolForksManager{

    constructor(blockchain){

        this.blockchain = blockchain;

        this.processForksQueue();
    }

    /*
        may the fork2 be with you Otto
    */
    newForkTip(socket, newChainLength, newChainStartingPoint, forkLastBlockHeader){

        if (typeof newChainLength !== "number") throw {message: "newChainLength is not a number"};
        if (typeof newChainStartingPoint !== "number") throw {message: "newChainStartingPoint is not a number"};

        if (newChainLength < this.blockchain.blocks.length){

            socket.node.sendRequest( "blockchain/header/new-block", this.blockchain.blocks.last.getBlockHeaderWithInformation() );

            throw {message: "Your blockchain is smaller than mine"};

        }

        if (newChainStartingPoint > newChainLength) throw {message: "Incorrect newChainStartingPoint"};
        if (newChainStartingPoint < 0 ) throw {message: "Incorrect2 newChainStartingPoint"};
        if (newChainStartingPoint > forkLastBlockHeader.height ) throw {message: "Incorrect3 newChainStartingPoint"};

    }

    processForksQueue(){

        let bestFork = this._getBestFork();

        this.blockchain.

        setTimeout( this.processTipsQueue.bind(this), 200 );
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