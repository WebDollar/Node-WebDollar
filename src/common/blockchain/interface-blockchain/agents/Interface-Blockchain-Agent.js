import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"

/**
 * An Agent is a class that force your machine to synchronize to the network based on the protocol you use it
 */

class InterfaceBlockchainAgent{

    constructor( blockchain, blockchainProtocolClass ){

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

    startAgent(){

        return new Promise((resolve)=>{

            NodesList.emitter.on("nodes-list/connected", async (result) => {

                // let's ask everybody
                this.queueRequests.push(result.socket);
                await this.protocol.askBlockchain( result.socket );

            });

            NodesList.emitter.on("nodes-list/disconnected", (result) => {

            });


        })

    }

    _setBlockchain(newBlockchain){

        this.blockchain = newBlockchain;
        this.protocol._setBlockchain(newBlockchain);
    }

}

export default InterfaceBlockchainAgent;