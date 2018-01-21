import InterfaceBlockchainAgent from "./Interface-Blockchain-Agent"
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"

class InterfaceBlockchainAgentFullNode extends InterfaceBlockchainAgent{

    createProtocol(){

        this.protocol = new (this.blockchainProtocolClass||InterfaceBlockchainProtocol) (this.blockchain);

        this.protocol.initialize(["acceptBlockHeaders", "acceptBlocks" ]);
    }

}

export default InterfaceBlockchainAgentFullNode;