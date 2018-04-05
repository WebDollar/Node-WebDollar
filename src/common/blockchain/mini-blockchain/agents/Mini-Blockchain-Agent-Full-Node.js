import PPoWBlockchainAgentFullNode from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Full-Node'
import InterfaceBlockchainAgentFullNode from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node'
import MiniBlockchainAdvancedProtocol from "common/blockchain/mini-blockchain/protocol/Mini-Blockchain-Advanced-Protocol"
import MiniBlockchainFork from '../protocol/Mini-Blockchain-Fork'
import consts from "consts/const_global";

let inheritAgentClass;

if (consts.POPOW_PARAMS.ACTIVATED) inheritAgentClass = PPoWBlockchainAgentFullNode;
else  inheritAgentClass = InterfaceBlockchainAgentFullNode;

class MiniBlockchainAgentFullNode extends inheritAgentClass{

    newFork(){
        let fork = new MiniBlockchainFork();
        MiniBlockchainFork.prototype.initializeConstructor.apply(fork, arguments);

        return fork;
    }

    newProtocol(){
        this.protocol = new MiniBlockchainAdvancedProtocol(this.blockchain, this);
    }

}

export default MiniBlockchainAgentFullNode;