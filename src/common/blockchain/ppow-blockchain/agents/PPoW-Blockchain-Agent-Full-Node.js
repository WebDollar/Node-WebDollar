import InterfaceBlockchainAgentFullNode from "common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node";
import PPoWBlockchainProtocol from "./../protocol/PPoW-Blockchain-Protocol"

class PPoWBlockchainAgentFullNode extends InterfaceBlockchainAgentFullNode{

    _newProtocol(){
        this.protocol = new PPoWBlockchainProtocol(this.blockchain, this);
    }

}

export default PPoWBlockchainAgentFullNode;