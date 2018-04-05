import MiniBlockchainProtocol from "../Mini-Blockchain-Protocol";
import MiniBlockchainLightProtocolForkSolver from "./Mini-Blockchain-Light-Protocol-Fork-Solver"
import consts from 'consts/const_global'

class MiniBlockchainLightProtocol extends MiniBlockchainProtocol{


    createForkSolver(){
        this.forkSolver = new MiniBlockchainLightProtocolForkSolver(this.blockchain, this);
    }

    _initializeNewSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        MiniBlockchainProtocol.prototype._initializeNewSocket.call(this, nodesListObject);


    }

}

export default MiniBlockchainLightProtocol