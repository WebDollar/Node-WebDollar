import PPoWBlockchainAgentFullNode from 'common/blockchain/ppow-blockchain/agents/PPoW-Blockchain-Agent-Full-Node'
import InterfaceBlockchainAgentFullNode from 'common/blockchain/interface-blockchain/agents/Interface-Blockchain-Agent-Full-Node'
import MiniBlockchainLightProtocol from "common/blockchain/mini-blockchain/protocol/light/Mini-Blockchain-Light-Protocol"
import MiniBlockchainForkLight from '../protocol/light/Mini-Blockchain-Light-Fork'
import consts from "consts/const_global";
import NodesList from 'node/lists/nodes-list';
import CONNECTION_TYPE from "node/lists/types/Connections-Type";
import Blockchain from "main-blockchain/Blockchain"
import AGENT_STATUS from "common/blockchain/interface-blockchain/agents/Agent-Status";

let inheritAgentClass;

if (consts.POPOW_PARAMS.ACTIVATED) inheritAgentClass = PPoWBlockchainAgentFullNode;
else  inheritAgentClass = InterfaceBlockchainAgentFullNode;

class MiniBlockchainAgentLightNode extends inheritAgentClass{

    constructor(blockchain){

        super(blockchain);

        this.light = true;
    }


    newFork(){
        let fork = new MiniBlockchainForkLight();
        MiniBlockchainForkLight.prototype.initializeConstructor.apply(fork, arguments);

        return fork;
    }

    _newProtocol(){
        this.protocol = new MiniBlockchainLightProtocol(this.blockchain, this);
    }


    initializeStartAgentOnce(){

        this._initializeProtocol();

        NodesList.emitter.on("nodes-list/disconnected", async (result) => {

            if ( NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_WEBRTC) < 3)
                Blockchain.synchronizeBlockchain(); //let's synchronize again

        });

        NodesList.emitter.on("nodes-list/connected", async (result) => {

            if ( NodesList.countNodesByConnectionType(CONNECTION_TYPE.CONNECTION_WEBRTC) > 6) {
                //let's disconnect from full nodes

                if (Math.random() < 0.9) {

                    this.status = AGENT_STATUS.AGENT_STATUS_SYNCHRONIZED_WEBRTC;

                    for (let i=NodesList.nodes.length-1; i>=0; i--)
                        if ( NodesList.nodes[i].connectionType === CONNECTION_TYPE.CONNECTION_CLIENT_SOCKET ){
                            NodesList.nodes[i].socket.disconnect();
                        }

                }
            }

        });
    }

}

export default MiniBlockchainAgentLightNode;