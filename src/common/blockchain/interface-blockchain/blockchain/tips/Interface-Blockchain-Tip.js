class InterfaceBlockchainTip{

    constructor(socket, forkChainLength, forkChainLengthToDo = -1 ){

        this.socket = socket;
        this.forkChainLength = forkChainLength;
        this.forkChainLengthToDo = forkChainLengthToDo;
    }

    processToDo(){

        if ( this.forkChainLengthToDo > 0 && this.forkChainLengthToDo > this.forkChainLength) {
            this.forkChainLength = this.forkChainLengthToDo;
            this.forkChainLengthToDo = -1;
            return true;
        }

        return false;

    }

}

export default InterfaceBlockchainTip;