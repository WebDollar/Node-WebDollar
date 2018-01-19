import InterfaceBlockchainAgentFullNode from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node'
import MiniBlockchainProtocol from "./../protocol/Mini-Blockchain-Protocol"

class MiniBlockchainAgentFullNode extends InterfaceBlockchainAgentFullNode{

    constructor(blockchain, blockchainProtocolClass){
        super(blockchain, blockchainProtocolClass||MiniBlockchainProtocol )
    }

}

export default MiniBlockchainAgentFullNode;