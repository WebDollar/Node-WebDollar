import MiniBlockchainAdvancedProtocol from "../Mini-Blockchain-Advanced-Protocol";
import MiniBlockchainLightProtocolForkSolver from "./Mini-Blockchain-Light-Protocol-Fork-Solver"

class MiniBlockchainLightProtocol extends MiniBlockchainAdvancedProtocol{


    createForkSolver(){
        this.forkSolver = new MiniBlockchainLightProtocolForkSolver(this.blockchain, this);
    }

    _initializeNewSocket(nodesListObject) {

        let socket = nodesListObject.socket;

        MiniBlockchainAdvancedProtocol.prototype._initializeNewSocket.call(this, nodesListObject);


    }

    _getBestFork(){

    }

}

export default MiniBlockchainLightProtocol