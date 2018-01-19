import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"

/**
 * An Agent is a class that force your machine to synchronize to the network based on the protocol you use it
 */

class InterfaceBlockchainAgent{

    constructor(blockchain, blockchainProtocolClass){

        this.blockchain = blockchain;
        this.blockchainProtocolClass = blockchainProtocolClass;

        this.createProtocol();
    }

    createProtocol(){

        this.protocol = new (this.blockchainProtocolClass||InterfaceBlockchainProtocol) (this.blockchain, ()=>{

            this.protocol.fullNode = true;

        });
    }

    async startAgent(){


        return true;

    }

}

export default InterfaceBlockchainAgent;