class InterfaceBlockchainTip{

    constructor(blockchain, socket, forkChainLength, forkLastBlockHeader, forkToDoChainLength = -1, forkToDoLastBlockHeader = null ){

        this.blockchain = blockchain;

        this.socket = socket;
        this.forkChainLength = forkChainLength;
        this.forkLastBlockHeader = forkLastBlockHeader;

        this.forkToDoChainLength = forkToDoChainLength;
        this.forkToDoLastBlockHeader = forkToDoLastBlockHeader;
    }

    updateToDo(){

        if ( this.forkToDoChainLength > 0 && this.forkToDoChainLength > this.forkChainLength) {
            this.forkChainLength = this.forkToDoChainLength;
            this.forkLastBlockHeader = this.forkToDoLastBlockHeader;
            this.forkToDoChainLength = -1;
            return true;
        }

        return false;

    }

    toString(){
        console.log("socket.uuid", this.socket.node.sckAddress.uuid, "forkChainLength", this.forkChainLength, "forkToDoChainLength", this.forkToDoChainLength );
    }

    validateTip(){

        let blockchainLength = this.blockchain.getBlockchainLength;

        if (blockchainLength < this.forkChainLength)
            return true;
        else
        if (blockchainLength === this.forkChainLength) //I need to check
            if (this.forkLastBlockHeader.hash.compare( this.blockchain.getHashPrev(this.blockchain.getBlockchainLength) ) <=0)
                return true;

        return false;
    }

}

export default InterfaceBlockchainTip;