import InterfaceBlockchainProtocolForkSolver from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol-Fork-Solver'
import PPowBlockchainProtocolForkSolver from 'common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Protocol-Fork-Solver'

let inheritForkSolver;
if (consts.POPOW_ACTIVATED) inheritProtocol = PPowBlockchainProtocolForkSolver;
else inheritProtocol = InterfaceBlockchainProtocolForkSolver;


class MiniBlockchainLightProtocolForkSolver extends inheritForkSolver{

}

export default MiniBlockchainLightProtocolForkSolver