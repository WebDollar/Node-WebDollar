import InterfaceBlockchainAgentFullNode from "common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node";
import PPoWBlockchainProtocol from "./../protocol/PPoW-Blockchain-Protocol"

class PPoWBlockchainAgentFullNode extends InterfaceBlockchainAgentFullNode{

    constructor(blockchain, blockchainProtocolClass, blockchainForkClass){
        super(blockchain, blockchainProtocolClass||PPoWBlockchainProtocol, blockchainForkClass)
    }

}

export default PPoWBlockchainAgentFullNode;