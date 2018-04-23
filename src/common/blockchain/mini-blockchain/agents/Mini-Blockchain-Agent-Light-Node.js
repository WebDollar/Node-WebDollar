import PPoWBlockchainAgentFullNode from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Full-Node'
import InterfaceBlockchainAgentFullNode from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node'
import MiniBlockchainLightProtocol from "common/blockchain/mini-blockchain/protocol/light/Mini-Blockchain-Light-Protocol"
import MiniBlockchainForkLight from '../protocol/light/Mini-Blockchain-Light-Fork'
import consts from "consts/const_global";
import NodesList from 'node/lists/nodes-list';
import CONNECTION_TYPE from "node/lists/types/Connections-Type";

let inheritAgentClass;

if (consts.POPOW_PARAMS.ACTIVATED) inheritAgentClass = PPoWBlockchainAgentFullNode;
else  inheritAgentClass = InterfaceBlockchainAgentFullNode;

class MiniBlockchainAgentLightNode extends inheritAgentClass{

    constructor(blockchain){

        super(blockchain);

        this.light = true;
    }

    _agentConfirmationIntervalFunction(){

        if (this.blockchain.blocks.length <= 0) return false;

        if ( NodesList.countNodes(CONNECTION_TYPE.CONNECTION_WEBRTC) <= 5 ) return false;

        this.synchronized = true;
    }

    newFork(){
        let fork = new MiniBlockchainForkLight();
        MiniBlockchainForkLight.prototype.initializeConstructor.apply(fork, arguments);

        return fork;
    }

    newProtocol(){
        this.protocol = new MiniBlockchainLightProtocol(this.blockchain, this);
    }

}

export default MiniBlockchainAgentLightNode;