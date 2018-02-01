import PPoWBlockchainAgentFullNode from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Full-Node'
import InterfaceBlockchainAgentFullNode from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node'
import MiniBlockchainLightProtocol from "common/blockchain/mini-blockchain/protocol/light/Mini-Blockchain-Light-Protocol"
import MiniBlockchainForkLight from '../protocol/light/Mini-Blockchain-Light-Fork'
import consts from "consts/const_global";

let inheritAgentClass;

if (consts.POPOW_ACTIVATED) inheritAgentClass = PPoWBlockchainAgentFullNode;
else  inheritAgentClass = InterfaceBlockchainAgentFullNode;

class MiniBlockchainAgentLightNode extends PPoWBlockchainAgentFullNode{

    constructor(blockchain, blockchainProtocolClass, blockchainForkClass){
        super(blockchain, blockchainProtocolClass||MiniBlockchainLightProtocol, blockchainForkClass||MiniBlockchainForkLight )

        this.light = true;

    }

}

export default MiniBlockchainAgentLightNode;