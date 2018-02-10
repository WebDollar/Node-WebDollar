class InterfaceBlockchainTip{

    constructor(socket, forkChainLength, forkChainLengthToDo = -1 ){

        this.socket = socket;
        this.forkChainLength = forkChainLength;
        this.forkChainLengthToDo = forkChainLengthToDo;
    }

}

export default InterfaceBlockchainTip;