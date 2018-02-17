import InterfaceBlockchainAgentBlockHeaders from "common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Block-Headers";
import PPoWBlockchainProtocol from "./../protocol/PPoW-Blockchain-Protocol"

class PPoWBlockchainAgentBlockHeaders extends InterfaceBlockchainAgentBlockHeaders{

    newProtocol(){
        this.protocol = new PPoWBlockchainProtocol(this.blockchain, this);
    }


}

export default PPoWBlockchainAgentBlockHeaders;