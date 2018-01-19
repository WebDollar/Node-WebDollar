import PPoWBlockchainAgentBlockHeaders from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Block-Headers'
import MiniBlockchainProtocol from "./../protocol/Mini-Blockchain-Protocol"

class MiniBlockchainAgentBlockHeaders extends PPoWBlockchainAgentBlockHeaders{

    constructor(blockchain, blockchainProtocolClass){
        super(blockchain, blockchainProtocolClass||MiniBlockchainProtocol )
    }

}

export default MiniBlockchainAgentBlockHeaders;