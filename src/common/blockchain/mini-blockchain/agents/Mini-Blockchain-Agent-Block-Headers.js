import PPoWBlockchainAgentBlockHeaders from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Block-Headers'
import InterfaceBlockchainAgentBlockHeaders from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Block-Headers'
import MiniBlockchainProtocol from "./../protocol/Mini-Blockchain-Protocol"
import consts from "consts/const_global";

let inheritAgentClass;

if (consts.POPOW_ACTIVATED) inheritAgentClass = PPoWBlockchainAgentBlockHeaders;
else  inheritAgentClass = InterfaceBlockchainAgentBlockHeaders;

class MiniBlockchainAgentBlockHeaders extends inheritAgentClass{

    constructor(blockchain, blockchainProtocolClass){
        super(blockchain, blockchainProtocolClass||MiniBlockchainProtocol )
    }

}

export default MiniBlockchainAgentBlockHeaders;