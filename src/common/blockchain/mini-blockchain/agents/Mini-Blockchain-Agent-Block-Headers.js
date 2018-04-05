import PPoWBlockchainAgentBlockHeaders from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Block-Headers'
import InterfaceBlockchainAgentBlockHeaders from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Block-Headers'
import MiniBlockchainAdvancedProtocol from "./../protocol/Mini-Blockchain-Advanced-Protocol"
import MiniBlockchainFork from '../protocol/Mini-Blockchain-Fork'
import consts from "consts/const_global";

let inheritAgentClass;

if (consts.POPOW_PARAMS.ACTIVATED) inheritAgentClass = PPoWBlockchainAgentBlockHeaders;
else  inheritAgentClass = InterfaceBlockchainAgentBlockHeaders;

class MiniBlockchainAgentBlockHeaders extends inheritAgentClass{

    newFork(){
        let fork = new MiniBlockchainFork();
        MiniBlockchainFork.prototype.initializeConstructor.apply(fork, arguments);

        return fork;
    }

    newProtocol(){
        this.protocol = new MiniBlockchainAdvancedProtocol(this.blockchain, this);
    }

}

export default MiniBlockchainAgentBlockHeaders;