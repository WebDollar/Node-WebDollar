import InterfaceBlockchainAgentBlockHeaders from "common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Block-Headers";
import PPoWBlockchainProtocol from "./../protocol/PPoW-Blockchain-Protocol"

class PPoWBlockchainAgentBlockHeaders extends InterfaceBlockchainAgentBlockHeaders{

    constructor(blockchain, blockchainProtocolClass){
        super(blockchain, blockchainProtocolClass||PPoWBlockchainProtocol )
    }

}

export default PPoWBlockchainAgentBlockHeaders;