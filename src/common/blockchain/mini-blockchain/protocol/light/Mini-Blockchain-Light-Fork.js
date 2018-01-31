import MiniBlockchainFork from "./../Mini-Blockchain-Fork"

class MiniBlockchainLightFork extends MiniBlockchainFork {

    constructor(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header) {

        super(blockchain, forkId, sockets, forkStartingHeight, forkChainStartingPoint, newChainLength, header)

        this.accountantTreeNew = null;
    }

    preFork() {

        //I have a new accountant Tree
        if (this.accountantTreeNew !== null && Buffer.isBuffer(this.accountantTreeNew)){

            this._accountantTreeRootClone = this.blockchain.accountantTree.cloneTree();
            this.blockchain.accountantTree.deserializeMiniAccountant( this.accountantTreeNew );

        } else
            //it is just a simple fork
            return MiniBlockchainFork.prototype.preFork.call(this);
    }

}

export default MiniBlockchainLightFork