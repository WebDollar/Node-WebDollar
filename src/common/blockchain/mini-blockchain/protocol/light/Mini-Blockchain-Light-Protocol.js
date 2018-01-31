import MiniBlockchainProtocol from "../Mini-Blockchain-Protocol";
import MiniBlockchainProtocolForkSolver from "./Mini-Blockchain-Light-Protocol-Fork-Solver"

class MiniBlockchainLightProtocol extends MiniBlockchainProtocol{

    constructor(blockchain){
        super(blockchain)
    }

    createForkSolver(){
        this.forkSolver = new MiniBlockchainProtocolForkSolver(this.blockchain, this);
    }

}

export default MiniBlockchainLightProtocol