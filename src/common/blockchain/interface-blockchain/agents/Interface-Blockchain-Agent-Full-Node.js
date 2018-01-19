import InterfaceBlockchainAgent from "./Interface-Blockchain-Agent"
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"

class InterfaceBlockchainAgentFullNode extends InterfaceBlockchainAgent{

    createProtocol(){

        this.protocol = new (this.blockchainProtocolClass||InterfaceBlockchainProtocol) (this.blockchain, ()=>{

            this.protocol.acceptBlockHeaders = true;
            this.protocol.acceptBlocks = true

        });
    }

}

export default InterfaceBlockchainAgentFullNode;