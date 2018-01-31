import MiniBlockchainProtocol from "../Mini-Blockchain-Protocol";
import MiniBlockchainLightProtocolForkSolver from "./Mini-Blockchain-Light-Protocol-Fork-Solver"

class MiniBlockchainLightProtocol extends MiniBlockchainProtocol{

    constructor(blockchain){
        super(blockchain)
    }

    createForkSolver(){
        this.forkSolver = new MiniBlockchainLightProtocolForkSolver(this.blockchain, this);
    }

}

export default MiniBlockchainLightProtocol