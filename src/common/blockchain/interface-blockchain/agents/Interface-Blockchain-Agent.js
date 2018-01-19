import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"

/**
 * An Agent is a class that force your machine to synchronize to the network based on the protocol you use it
 */

class InterfaceBlockchainAgent{

    constructor(blockchain, blockchainProtocolClass){

        this.blockchain = blockchain;
        this.blockchainProtocolClass = blockchainProtocolClass;
        this.queueRequests = [];

        this.createProtocol();
    }

    createProtocol(){

        this.protocol = new (this.blockchainProtocolClass||InterfaceBlockchainProtocol) (this.blockchain, ()=>{

            this.protocol.fullNode = true;

        });
    }

    async startAgent(){

        NodesList.emitter.on("nodes-list/connected", (result) => {

            this.queueRequests.push(result.socket);

        });
        NodesList.emitter.on("nodes-list/disconnected", (result) => {

        });

        return true;

    }

}

export default InterfaceBlockchainAgent;