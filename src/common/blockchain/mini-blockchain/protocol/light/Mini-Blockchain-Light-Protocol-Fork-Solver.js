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

            let heightRequired = newChainLength - consts.POW_PARAMS.LIGHT_VALIDATE_LAST_BLOCKS - 1;

            let blockHeaderResult = await socket.node.sendRequestWaitOnce("blockchain/headers-info/request-header-info-by-height", {height: heightRequired }, heightRequired );

            if (blockHeaderResult === null)
                throw "LightProtocolForkSolver _calculateForkBinarySearch headers-info dropped " + heightRequired;

            return {position: heightRequired, header: blockHeaderResult};

        } else

            return await inheritForkSolver.prototype._calculateForkBinarySearch.call(this, socket, newChainStartingPoint, newChainLength, currentBlockchainLength);


    }

    async solveFork(fork) {

        let socket = fork.sockets[Math.floor(Math.random() * fork.sockets.length)];

        //download the new Accountant Tree, in case there is a new fork and I don't have anything in common
        console.log(colors.yellow(" fork.forkChainStartingPoint "+ fork.forkChainStartingPoint + "  "+ "fork.forkStartingHeight "+ fork.forkStartingHeight + " length "+ fork.forkChainLength));

        if (fork.forkChainStartingPoint === fork.forkStartingHeight) {

            let answer = await socket.node.sendRequestWaitOnce("get/blockchain/accountant-tree/get-accountant-tree", {height: fork.forkChainStartingPoint }, fork.forkChainStartingPoint );

            if (answer === null) throw "get-accountant-tree never received " + (fork.forkChainStartingPoint);

            fork.forkPrevAccountantTree = answer.accountantTree;


            answer = await socket.node.sendRequestWaitOnce("get/blockchain/light/get-light-settings", {height: fork.forkChainStartingPoint  }, fork.forkChainStartingPoint );

            if (answer === null) throw "get-light-settings never received " + (fork.forkChainStartingPoint);
            if (answer.result === false) throw "get-light-settings received by it is false ";

            if (answer.difficultyTarget === null ) throw "get-light-settings difficultyTarget is null";
            if (answer.timeStamp === null ) throw "get-light-settings timeStamp is null";
            if (answer.hashPrev === null ) throw "get-light-settings hashPrev is null";

            console.log("answer.difficultyTarget",answer.difficultyTarget)

            fork.forkPrevDifficultyTarget = answer.difficultyTarget;
            fork.forkPrevTimeStamp = answer.timeStamp;
            fork.forkPrevHashPrev = answer.hashPrev;

        } else {
            fork.forkPrevAccountantTree = null;
            fork.forkPrevDifficultyTarget = null;
            fork.forkPrevTimeStamp = null;
            fork.forkPrevHashPrev = null;
        }

        return inheritForkSolver.prototype.solveFork.call(this, fork);

    }

}

export default MiniBlockchainLightProtocolForkSolver