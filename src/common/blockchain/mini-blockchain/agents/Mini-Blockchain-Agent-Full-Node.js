import PPoWBlockchainAgentFullNode from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Full-Node'
import InterfaceBlockchainAgentFullNode from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node'
import MiniBlockchainProtocol from "common/blockchain/mini-blockchain/protocol/Mini-Blockchain-Protocol"
import MiniBlockchainFork from '../protocol/Mini-Blockchain-Fork'
import consts from "consts/const_global";

let inheritAgentClass;

if (consts.POPOW_ACTIVATED) inheritAgentClass = PPoWBlockchainAgentFullNode;
else  inheritAgentClass = InterfaceBlockchainAgentFullNode;


class MiniBlockchainAgentFullNode extends inheritAgentClass{

    constructor(blockchain, blockchainProtocolClass, blockchainForkClass){
        super(blockchain, blockchainProtocolClass||MiniBlockchainProtocol, blockchainForkClass || MiniBlockchainFork )
    }

}

export default MiniBlockchainAgentFullNode;