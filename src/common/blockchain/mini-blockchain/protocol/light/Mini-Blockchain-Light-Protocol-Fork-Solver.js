import InterfaceBlockchainProtocolForkSolver from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol-Fork-Solver'
import PPowBlockchainProtocolForkSolver from 'common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Protocol-Fork-Solver'

let inheritForkSolver;
if (consts.POPOW_ACTIVATED) inheritProtocol = PPowBlockchainProtocolForkSolver;
else inheritProtocol = InterfaceBlockchainProtocolForkSolver;


class MiniBlockchainLightProtocolForkSolver extends inheritForkSolver{

    async solveFork(fork) {

        let socket = fork.sockets[Math.floor(Math.random() * fork.sockets.length)];

        //download the new Accountant Tree, in case there is a new fork and I don't have anything in common
        if (fork.forkStartingHeight === fork.forkChainStartingPoint) {
            let answer = await socket.node.sendRequestWaitOnce("get/blockchain/accountant-tree/get-accountant-tree", {height: fork.forkChainStartingPoint - 1}, fork.forkChainStartingPoint - 1);

            if (answer === null)
                throw "get-accountant-tree never received " + fork.forkChainStartingPoint - 1;

            let forkAccountantTree = answer.accountantTree;
            fork.accountantTree
        }
        return inheritForkSolver.prototype.solveFork.call(this, fork);

    }

}

export default MiniBlockchainLightProtocolForkSolver