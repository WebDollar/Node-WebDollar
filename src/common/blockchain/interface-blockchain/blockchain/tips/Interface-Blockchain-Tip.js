class InterfaceBlockchainTip{

    constructor(blockchain, socket, forkChainLength, forkLastBlockHeader){

        this.blockchain = blockchain;

        this.socket = socket;
        this.forkChainLength = forkChainLength;
        this.forkLastBlockHeader = forkLastBlockHeader;

        this.forkPromise = new Promise((resolve)=>{
            this.forkResolve = resolve;
        })

        this.forkToDoChainLength = -1;
        this.forkToDoLastBlockHeader = undefined;
        this.forkToDoPromise = undefined;
        this.forkToDoResolve = undefined;
    }

    updateToDo(){

        if ( this.forkToDoChainLength > 0 && this.forkToDoChainLength > this.forkChainLength) {

            if (this.forkResolve !== undefined)
                this.forkResolve(false);

            this.forkChainLength = this.forkToDoChainLength;
            this.forkLastBlockHeader = this.forkToDoLastBlockHeader;
            this.forkPromise = this.forkToDoPromise;
            this.forkResolve = this.forkToDoResolve;


            this.forkToDoChainLength = -1;
            this.forkToDoLastBlockHeader = undefined;
            this.forkToDoPromise = undefined;
            this.forkToDoResolve = undefined;

            return true;
        }

        return false;

    }

    toString(){
        return "socket.uuid " + this.socket.node.sckAddress.uuid + " forkChainLength " + this.forkChainLength + " forkToDoChainLength " + this.forkToDoChainLength;
    }

    validateTip(){

        // console.log("this.blockchain.blocks.length", this.blockchain.blocks.length);
        // console.log("this.forkChainLength", this.forkChainLength);

        if (this.blockchain.blocks.length < this.forkChainLength)
            return true;
        else
        if (this.blockchain.blocks.length === this.forkChainLength) //I need to check
            if (this.forkLastBlockHeader.hash.compare( this.blockchain.getHashPrev(this.blockchain.blocks.length) ) < 0)
                return true;

        return false;
    }

}

export default InterfaceBlockchainTip;