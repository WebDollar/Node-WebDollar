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

            let timeOut = setTimeout(()=>{

                resolve({
                    result: false,
                    message: "Start Agent Timeout",
                });

            }, 30000);


            let emitterConnected = NodesList.emitter.on("nodes-list/connected", async (result) => {

                // let's ask everybody
                this.queueRequests.push(result.socket);
                await this.protocol.askBlockchain( result.socket );

                result.socket.node.protocol.agent.startedAgentDone = true;

                //check if start Agent is finished
                let done = true;
                for (let i=0; i<NodesList.nodes.length; i++)
                    if (NodesList[i].socket.level <= 3 && NodesList[i].socket.node.protocol.agent.startedAgentDone === false){
                        done = false;
                    }

                if (done === true){
                        
                    clearTimeout(timeOut);
                    if (emitterDisconnected !== undefined) emitterDisconnected();
                    if (emitterConnected !== undefined) emitterDisconnected();

                    resolve({
                        result: true,
                        message: "Start Agent worked successfully",
                    });
                }

            });

            let emitterDisconnected = NodesList.emitter.on("nodes-list/disconnected", (result) => {

            });


        })

    }

    _setBlockchain(newBlockchain){

        this.blockchain = newBlockchain;
        this.protocol._setBlockchain(newBlockchain);
    }

}

export default InterfaceBlockchainAgent;