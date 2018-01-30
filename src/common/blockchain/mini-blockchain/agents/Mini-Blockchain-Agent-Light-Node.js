import PPoWBlockchainAgentFullNode from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Full-Node'
import InterfaceBlockchainAgentFullNode from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node'
import MiniBlockchainProtocol from "common/blockchain/mini-blockchain/protocol/Mini-Blockchain-Protocol"
import consts from "consts/const_global";

let inheritAgentClass;

if (consts.POPOW_ACTIVATED) inheritAgentClass = PPoWBlockchainAgentFullNode;
else  inheritAgentClass = InterfaceBlockchainAgentFullNode;

class MiniBlockchainAgentLightNode extends PPoWBlockchainAgentFullNode{

    constructor(blockchain, blockchainProtocolClass){
        super(blockchain, blockchainProtocolClass||MiniBlockchainProtocol )
    }

}

export default MiniBlockchainAgentLightNode;