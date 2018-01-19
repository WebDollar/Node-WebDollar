import InterfaceBlockchainAgent from "./Interface-Blockchain-Agent"
import InterfaceBlockchainProtocol from "./../protocol/Interface-Blockchain-Protocol"

// TODO not fully working for only headers

class InterfaceBlockchainAgentBlockHeader extends InterfaceBlockchainAgent{

    createProtocol(){

        this.protocol = new (this.blockchainProtocolClass||InterfaceBlockchainProtocol) (this.blockchain, ()=>{

            this.protocol.acceptBlockHeaders = true;
            this.protocol.acceptBlocks = false

        });
    }

}

export default InterfaceBlockchainAgentBlockHeader;