import InterfaceBlockchainAgentBlockHeader from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Block-Header'
import MiniBlockchainProtocol from "./../protocol/Mini-Blockchain-Protocol"

class MiniBlockchainAgentBlockHeade extends InterfaceBlockchainAgentBlockHeader{

    constructor(blockchain, blockchainProtocolClass){
        super(blockchain, blockchainProtocolClass||MiniBlockchainProtocol )
    }

}

export default MiniBlockchainAgentBlockHeade;