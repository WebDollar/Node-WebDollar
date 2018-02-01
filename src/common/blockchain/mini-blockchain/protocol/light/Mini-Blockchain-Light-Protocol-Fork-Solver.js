const colors = require('colors/safe');
import InterfaceBlockchainProtocolForkSolver from 'common/blockchain/interface-blockchain/protocol/Interface-Blockchain-Protocol-Fork-Solver'
import PPowBlockchainProtocolForkSolver from 'common/blockchain/ppow-blockchain/protocol/PPoW-Blockchain-Protocol-Fork-Solver'
import consts from 'consts/const_global'

let inheritForkSolver;

if (consts.POPOW_ACTIVATED) inheritForkSolver = PPowBlockchainProtocolForkSolver;
else inheritForkSolver = InterfaceBlockchainProtocolForkSolver;


class MiniBlockchainLightProtocolForkSolver extends inheritForkSolver{

    async _calculateForkBinarySearch(socket, newChainStartingPoint, newChainLength, currentBlockchainLength){

        console.log("chainStartingPoint", newChainStartingPoint, "newChainLength", newChainLength, "currentBlockchainLength", currentBlockchainLength)

        if (newChainStartingPoint > currentBlockchainLength-1) {

            let heightRequired = newChainLength - consts.POW_PARAMS.VALIDATE_LAST_BLOCKS - 1;

            let blockHeaderResult = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", {height: heightRequired }, heightRequired );

            if (blockHeaderResult === null)
                throw "LightProtocolForkSolver _calculateForkBinarySearch headers-info dropped " + heightRequired;

            return {position: heightRequired, header: blockHeaderResult};

        } else

            return await this._discoverForkBinarySearch(socket, newChainStartingPoint, currentBlockchainLength - 1);


    }

    async solveFork(fork) {

        let socket = fork.sockets[Math.floor(Math.random() * fork.sockets.length)];

        //download the new Accountant Tree, in case there is a new fork and I don't have anything in common
        console.log(colors.yellow("fork.forkStartingHeight "+ fork.forkStartingHeight+ "fork.forkChainStartingPoint "+ fork.forkChainStartingPoint));

        if (fork.forkStartingHeight === fork.forkChainStartingPoint) {

            let answer = await socket.node.sendRequestWaitOnce("get/blockchain/accountant-tree/get-accountant-tree", {height: fork.forkChainStartingPoint -1 }, fork.forkChainStartingPoint -1 );

            if (answer === null) throw "get-accountant-tree never received " + fork.forkChainStartingPoint - 1;

            fork.forkPrevAccountantTree = answer.accountantTree;


            answer = await socket.node.sendRequestWaitOnce("get/blockchain/light/get-light-settings", {height: fork.forkChainStartingPoint  }, fork.forkChainStartingPoint );

            if (answer === null) throw "get-light-settings never received " + fork.forkChainStartingPoint - 1;

            if (answer.difficultyTarget === null ) throw "get-light-settings difficultyTarget is null";

            fork.forkPrevDifficultyTarget = answer.difficultyTarget;
            fork.forkPrevTimeStamp = answer.timeStamp;
            fork.forkPrevHashPrev = answer.hashPrev;

        } else
            fork.forkPrevAccountantTree = null;

        return inheritForkSolver.prototype.solveFork.call(this, fork);

    }

}

export default MiniBlockchainLightProtocolForkSolver