import InterfaceBlockchainAgentFullNode from "common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node";
import PPoWBlockchainProtocol from "./../protocol/PPoW-Blockchain-Protocol"

class PPoWBlockchainAgent extends InterfaceBlockchainAgentFullNode{

    constructor(blockchain, blockchainProtocolClass){
        super(blockchain, blockchainProtocolClass||PPoWBlockchainProtocol )
    }

}

export default PPoWBlockchainAgent;