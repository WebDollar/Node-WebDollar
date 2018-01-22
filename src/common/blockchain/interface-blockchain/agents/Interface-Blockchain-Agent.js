import NodesList from 'node/lists/nodes-list'
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"

/**
 * An Agent is a class that force your machine to synchronize to the network based on the protocol you use it
 */

class InterfaceBlockchainAgent{

    constructor( blockchain, blockchainProtocolClass ){

        this.blockchain = blockchain;
        this.blockchainProtocolClass = blockchainProtocolClass;

        this.createProtocol();
    }

    createProtocol(){

        this.protocol = new (this.blockchainProtocolClass||InterfaceBlockchainProtocol) (this.blockchain, ()=>{

            this.protocol.fullNode = true;

        });

        this.requestBlockchainForNewPeer();
    }

    requestBlockchainForNewPeer(){

        NodesList.emitter.on("nodes-list/connected", async (result) => {

            // let's ask everybody

            try {
                let result = await this.protocol.askBlockchain(result.socket);
            } catch (exception){

            }

            result.socket.node.protocol.agent.startedAgentDone = true;

            //check if start Agent is finished
            if (this.startAgentResolver !== undefined) {

                let done = true;
                for (let i = 0; i < NodesList.nodes.length; i++)
                    if (NodesList[i].socket.level <= 3 && NodesList[i].socket.node.protocol.agent.startedAgentDone === false) {
                        done = false;
                    }

                if (done === true && this.startAgentResolver !== undefined) {

                    clearTimeout(this.startAgentTimeOut);

                    let resolver = this.startAgentResolver;
                    this.startAgentResolver = undefined;

                    resolver({
                        result: true,
                        message: "Start Agent worked successfully",
                    });

                }

            }

        });

        NodesList.emitter.on("nodes-list/disconnected", (result) => {

        });

    }

    startAgent(){

        return new Promise((resolve)=>{

            this.startAgentResolver = resolve;

            this.startAgentTimeOut = setTimeout(()=>{

                this.startAgentResolver = undefined;
                resolve({
                    result: false,
                    message: "Start Agent Timeout",
                });

            }, 20000);

        })

    }

    _setBlockchain(newBlockchain){

        this.blockchain = newBlockchain;
        this.protocol._setBlockchain(newBlockchain);
    }

}

export default InterfaceBlockchainAgent;